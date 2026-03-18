package com.example.ecommerce.order.controller;

import com.example.ecommerce.common.domain.PaymentMethod;
import com.example.ecommerce.common.domain.UserRole;
import com.example.ecommerce.modal.*;
import com.example.ecommerce.order.request.CancelOrderRequest;
import com.example.ecommerce.repository.PaymentOrderRepository;
import com.example.ecommerce.order.response.OrderHistoryItemResponse;
import com.example.ecommerce.order.response.OrderHistoryProductResponse;
import com.example.ecommerce.order.response.OrderHistoryResponse;
import com.example.ecommerce.order.response.OrderShippingAddressResponse;
import com.example.ecommerce.order.response.PaymentLinkResponse;
import com.example.ecommerce.order.service.CartService;
import com.example.ecommerce.order.service.OrderService;
import com.example.ecommerce.order.service.PaymentService;
import com.example.ecommerce.seller.service.SellerReportService;
import com.example.ecommerce.seller.service.SellerService;
import com.example.ecommerce.user.service.UserService;
import com.razorpay.PaymentLink;
import lombok.RequiredArgsConstructor;
import org.hibernate.Hibernate;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/orders")
public class OrderController {
    private static final List<String> CANCEL_REASONS = List.of(
            "FOUND_BETTER_PRICE",
            "CHANGED_MY_MIND",
            "ORDERED_BY_MISTAKE",
            "DELIVERY_IS_TOO_LATE",
            "NEED_TO_CHANGE_ADDRESS",
            "PAYMENT_ISSUE",
            "OTHER"
    );

    private final OrderService orderService;
    private final UserService userService;
    private final CartService cartService;
    private final SellerService sellerService;
    private final SellerReportService sellerReportService;
    private final PaymentService paymentService;
    private final PaymentOrderRepository paymentOrderRepository;

    @PostMapping
    @PreAuthorize("hasAnyRole('CUSTOMER','ADMIN')")
    public ResponseEntity<PaymentLinkResponse> createPaymentLink(
            @RequestBody Address shippingAddress,
            @RequestParam PaymentMethod paymentMethod,
            @RequestHeader("Authorization") String jwt
    ) throws Exception {
        User user = userService.findUserByJwtToken(jwt);
        Cart cart = cartService.findUserCart(user);
        if (cart.getCartItems() == null || cart.getCartItems().isEmpty()) {
            throw new IllegalArgumentException("Cart is empty");
        }

        Set<Order> orders = orderService.createOrder(user, shippingAddress, cart);
        PaymentOrder paymentOrder = paymentService.createOrder(user, orders);

        PaymentLinkResponse response = new PaymentLinkResponse();
        if (paymentMethod.equals(PaymentMethod.RAZORPAY)) {
            PaymentLink payment = paymentService.createRazorpayPaymentLink(user, paymentOrder.getAmount(), paymentOrder.getId());
            String paymentUrl = payment.get("short_url");
            String paymentUrlId = payment.get("id");
            response.setPayment_link_url(paymentUrl);
            paymentOrder.setPaymentLinkId(paymentUrlId);
            paymentOrderRepository.save(paymentOrder);
        } else {
            String paymentUrl = paymentService.createStripePaymentLink(user, paymentOrder.getAmount(), paymentOrder.getId());
            response.setPayment_link_url(paymentUrl);
            response.setPayment_link_id(String.valueOf(paymentOrder.getId()));
        }

        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @GetMapping("/user/history")
    @PreAuthorize("hasAnyRole('CUSTOMER','ADMIN')")
    @Transactional(readOnly = true)
    public ResponseEntity<List<OrderHistoryResponse>> usersOrderHistory(
            @RequestHeader("Authorization") String jwt
    ) throws Exception {
        User user = userService.findUserByJwtToken(jwt);
        List<Order> orders = orderService.usersOrderHistory(user.getId());
        List<OrderHistoryResponse> response = orders.stream().map(this::toOrderHistoryResponse).toList();
        return new ResponseEntity<>(response, HttpStatus.ACCEPTED);
    }

    @GetMapping("/{orderId}")
    @PreAuthorize("hasAnyRole('CUSTOMER','ADMIN')")
    @Transactional(readOnly = true)
    public ResponseEntity<OrderHistoryResponse> getOrderById(
            @PathVariable Long orderId,
            @RequestHeader("Authorization") String jwt
    ) throws Exception {
        User user = userService.findUserByJwtToken(jwt);
        Order order = orderService.findOrderById(orderId);

        if (user.getRole() != UserRole.ROLE_ADMIN && (order.getUser() == null || !order.getUser().getId().equals(user.getId()))) {
            throw new AccessDeniedException("Unauthorized order access");
        }

        return new ResponseEntity<>(toOrderHistoryResponse(order), HttpStatus.ACCEPTED);
    }

    @GetMapping("/item/{orderItemId}")
    @PreAuthorize("hasAnyRole('CUSTOMER','ADMIN')")
    @Transactional(readOnly = true)
    public ResponseEntity<OrderHistoryItemResponse> getOrderItemById(
            @PathVariable Long orderItemId,
            @RequestHeader("Authorization") String jwt
    ) throws Exception {
        User user = userService.findUserByJwtToken(jwt);
        OrderItem orderItem = orderService.getOrderItemById(orderItemId);

        if (user.getRole() != UserRole.ROLE_ADMIN && (orderItem.getOrder() == null || orderItem.getOrder().getUser() == null
                || !orderItem.getOrder().getUser().getId().equals(user.getId()))) {
            throw new AccessDeniedException("Unauthorized order item access");
        }

        return new ResponseEntity<>(toOrderItemResponse(orderItem), HttpStatus.ACCEPTED);
    }

    @GetMapping("/cancel-reasons")
    @PreAuthorize("hasAnyRole('CUSTOMER','ADMIN')")
    public ResponseEntity<List<String>> getCancelReasons() {
        return ResponseEntity.ok(CANCEL_REASONS);
    }

    @PutMapping("/{orderId}/cancel")
    @PreAuthorize("hasAnyRole('CUSTOMER','ADMIN')")
    @Transactional
    public ResponseEntity<OrderHistoryResponse> cancelOrder(
            @PathVariable Long orderId,
            @Valid @RequestBody CancelOrderRequest request,
            @RequestHeader("Authorization") String jwt
    ) throws Exception {
        User user = userService.findUserByJwtToken(jwt);
        Order order = orderService.cancelOrder(
                orderId,
                user,
                request.getCancelReasonCode(),
                request.getCancelReasonText()
        );

        Seller seller = sellerService.getSellerById(order.getSellerId());
        SellerReport report = sellerReportService.getSellerReport(seller);
        report.setCancelledOrders(report.getCancelledOrders() + 1);
        report.setTotalRefunds(report.getTotalRefunds() + order.getTotalSellingPrice());
        sellerReportService.updateSellerReport(report);

        return new ResponseEntity<>(toOrderHistoryResponse(order), HttpStatus.ACCEPTED);
    }

    private OrderHistoryResponse toOrderHistoryResponse(Order order) {
        OrderHistoryResponse response = new OrderHistoryResponse();
        response.setId(order.getId());
        response.setOrderStatus(order.getOrderStatus() != null ? order.getOrderStatus().name() : "PENDING");
        response.setTotalSellingPrice(order.getTotalSellingPrice());
        response.setTotalItems(order.getTotalItems());
        response.setOrderDate(order.getOrderDate());
        response.setCancelledAt(order.getCancelledAt());
        response.setCancelReasonCode(order.getCancelReasonCode());
        response.setCancelReasonText(order.getCancelReasonText());
        response.setShippingAddress(toShippingAddressResponse(order.getShippingAddress()));

        List<OrderHistoryItemResponse> items = order.getOrderItems().stream()
                .map(this::toOrderItemResponse)
                .toList();

        response.setOrderItems(items);
        return response;
    }

    private OrderHistoryItemResponse toOrderItemResponse(OrderItem orderItem) {
        OrderHistoryItemResponse itemResponse = new OrderHistoryItemResponse();
        itemResponse.setId(orderItem.getId());
        itemResponse.setSize(orderItem.getSize());
        itemResponse.setQuantity(orderItem.getQuantity());
        itemResponse.setMrpPrice(orderItem.getMrpPrice());
        itemResponse.setSellingPrice(orderItem.getSellingPrice());

        if (orderItem.getProduct() != null) {
            OrderHistoryProductResponse product = new OrderHistoryProductResponse();
            product.setId(orderItem.getProduct().getId());
            product.setTitle(orderItem.getProduct().getTitle());
            product.setDescription(orderItem.getProduct().getDescription());

            if (Hibernate.isInitialized(orderItem.getProduct().getImages())) {
                product.setImages(new ArrayList<>(orderItem.getProduct().getImages()));
            } else {
                product.setImages(List.of());
            }

            itemResponse.setProduct(product);
        }

        return itemResponse;
    }

    private OrderShippingAddressResponse toShippingAddressResponse(Address address) {
        if (address == null) return null;
        OrderShippingAddressResponse response = new OrderShippingAddressResponse();
        response.setName(address.getName());
        response.setStreet(address.getStreet());
        response.setLocality(address.getLocality());
        response.setAddress(address.getAddress());
        response.setCity(address.getCity());
        response.setState(address.getState());
        response.setPinCode(address.getPinCode());
        response.setMobileNumber(address.getMobileNumber());
        return response;
    }
}
