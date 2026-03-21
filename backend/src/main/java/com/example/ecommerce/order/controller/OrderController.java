package com.example.ecommerce.order.controller;

import com.example.ecommerce.common.domain.PaymentMethod;
import com.example.ecommerce.common.domain.PaymentProvider;
import com.example.ecommerce.common.domain.PaymentStatus;
import com.example.ecommerce.common.domain.PaymentType;
import com.example.ecommerce.common.domain.UserRole;
import com.example.ecommerce.inventory.service.InventoryService;
import com.example.ecommerce.modal.*;
import com.example.ecommerce.order.request.CheckoutOrderRequest;
import com.example.ecommerce.order.request.CancelOrderRequest;
import com.example.ecommerce.repository.PaymentOrderRepository;
import com.example.ecommerce.order.response.CheckoutOrderSummaryResponse;
import com.example.ecommerce.order.response.OrderHistoryItemResponse;
import com.example.ecommerce.order.response.OrderHistoryProductResponse;
import com.example.ecommerce.order.response.OrderHistoryResponse;
import com.example.ecommerce.order.response.OrderShippingAddressResponse;
import com.example.ecommerce.order.response.PaymentLinkResponse;
import com.example.ecommerce.order.response.PhonePePaymentSession;
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

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
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
    private final InventoryService inventoryService;

    @PostMapping
    @PreAuthorize("hasAnyRole('CUSTOMER','ADMIN')")
    public ResponseEntity<PaymentLinkResponse> createPaymentLink(
            @RequestBody Address shippingAddress,
            @RequestParam String paymentMethod,
            @RequestHeader("Authorization") String jwt
    ) throws Exception {
        User user = userService.findUserByJwtToken(jwt);
        PaymentMethod resolvedPaymentMethod = resolveCheckoutPaymentMethod(paymentMethod == null ? "" : paymentMethod.trim().toUpperCase());
        PaymentLinkResponse response = resolvedPaymentMethod == PaymentMethod.COD
                ? createCashOnDeliveryResponse(user, shippingAddress)
                : createOnlinePaymentResponse(user, shippingAddress, resolvedPaymentMethod);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @PostMapping("/create")
    @PreAuthorize("hasAnyRole('CUSTOMER','ADMIN')")
    public ResponseEntity<PaymentLinkResponse> createCheckoutOrder(
            @Valid @RequestBody CheckoutOrderRequest request,
            @RequestHeader("Authorization") String jwt
    ) throws Exception {
        User user = userService.findUserByJwtToken(jwt);
        String normalizedPaymentMethod = request.getPaymentMethod() == null
                ? ""
                : request.getPaymentMethod().trim().toUpperCase();

        if ("COD".equals(normalizedPaymentMethod)) {
            return new ResponseEntity<>(createCashOnDeliveryResponse(user, request.getShippingAddress()), HttpStatus.OK);
        }

        return new ResponseEntity<>(
                createOnlinePaymentResponse(
                        user,
                        request.getShippingAddress(),
                        resolveCheckoutPaymentMethod(normalizedPaymentMethod)
                ),
                HttpStatus.OK
        );
    }

    @PostMapping("/summary")
    @PreAuthorize("hasAnyRole('CUSTOMER','ADMIN')")
    public ResponseEntity<CheckoutOrderSummaryResponse> getCheckoutSummary(
            @RequestHeader("Authorization") String jwt
    ) throws Exception {
        User user = userService.findUserByJwtToken(jwt);
        Cart cart = requireCart(user);

        CheckoutOrderSummaryResponse response = new CheckoutOrderSummaryResponse();
        CheckoutOrderSummaryResponse.PriceBreakdown priceBreakdown =
                new CheckoutOrderSummaryResponse.PriceBreakdown();
        priceBreakdown.setPlatformFee(0);
        priceBreakdown.setTotalMRP(cart.getTotalMrpPrice());
        priceBreakdown.setTotalSellingPrice((int) Math.round(cart.getTotalSellingPrice()));
        priceBreakdown.setTotalDiscount(cart.getDiscount());
        response.setPriceBreakdown(priceBreakdown);
        response.setEstimatedDeliveryDate(LocalDate.now().plusDays(5).toString());
        response.setOrderItems(
                cart.getCartItems().stream()
                        .sorted(Comparator.comparing(CartItem::getId, Comparator.nullsLast(Long::compareTo)))
                        .map(item -> {
                            CheckoutOrderSummaryResponse.OrderItemSummary summary =
                                    new CheckoutOrderSummaryResponse.OrderItemSummary();
                            summary.setId(item.getId());
                            return summary;
                        })
                        .toList()
        );

        return ResponseEntity.ok(response);
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

        if (order.getOrderItems() != null) {
            for (OrderItem orderItem : order.getOrderItems()) {
                if (orderItem.getProduct() != null) {
                    inventoryService.restoreWarehouseStockFromCancellation(
                            orderItem.getProduct(),
                            orderItem.getQuantity(),
                            orderItem.getId(),
                            "Order cancelled and stock returned to warehouse"
                    );
                }
            }
        }

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
        response.setPaymentStatus(order.getPaymentStatus() != null ? order.getPaymentStatus().name() : "PENDING");
        response.setPaymentMethod(order.getPaymentMethod());
        response.setPaymentType(order.getPaymentType());
        response.setProvider(order.getProvider());
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

    private Cart requireCart(User user) throws Exception {
        Cart cart = cartService.findUserCart(user);
        if (cart.getCartItems() == null || cart.getCartItems().isEmpty()) {
            throw new IllegalArgumentException("Cart is empty");
        }
        return cart;
    }

    private PaymentLinkResponse createOnlinePaymentResponse(
            User user,
            Address shippingAddress,
            PaymentMethod paymentMethod
    ) throws Exception {
        Cart cart = requireCart(user);
        if (paymentMethod == PaymentMethod.UPI) {
            paymentService.assertPhonePeConfigured();
            Set<Order> orders = orderService.createOrder(
                    user,
                    shippingAddress,
                    cart,
                    com.example.ecommerce.common.domain.OrderStatus.INITIATED,
                    PaymentStatus.PENDING,
                    PaymentMethod.UPI,
                    PaymentType.UPI,
                    PaymentProvider.PHONEPE
            );
            PaymentOrder paymentOrder = paymentService.createOrder(
                    user,
                    orders,
                    PaymentMethod.UPI,
                    PaymentType.UPI,
                    PaymentProvider.PHONEPE
            );
            PhonePePaymentSession session = paymentService.createPhonePePaymentSession(user, paymentOrder);
            return buildPaymentResponse(
                    orders,
                    paymentOrder.getId(),
                    PaymentMethod.UPI,
                    PaymentType.UPI,
                    PaymentProvider.PHONEPE,
                    PaymentStatus.PENDING,
                    com.example.ecommerce.common.domain.OrderStatus.INITIATED,
                    session.getRedirectUrl(),
                    session.getMerchantTransactionId()
            );
        }

        Set<Order> orders = orderService.createOrder(
                user,
                shippingAddress,
                cart,
                com.example.ecommerce.common.domain.OrderStatus.INITIATED,
                PaymentStatus.PENDING,
                PaymentMethod.CARD,
                PaymentType.CARD,
                PaymentProvider.STRIPE
        );
        PaymentOrder paymentOrder = paymentService.createOrder(
                user,
                orders,
                PaymentMethod.CARD,
                PaymentType.CARD,
                PaymentProvider.STRIPE
        );
        String paymentUrl = paymentService.createStripePaymentLink(
                user,
                paymentOrder.getAmount(),
                paymentOrder.getId()
        );
        paymentOrder.setPaymentLinkId(String.valueOf(paymentOrder.getId()));
        paymentOrderRepository.save(paymentOrder);
        return buildPaymentResponse(
                orders,
                paymentOrder.getId(),
                PaymentMethod.CARD,
                PaymentType.CARD,
                PaymentProvider.STRIPE,
                PaymentStatus.PENDING,
                com.example.ecommerce.common.domain.OrderStatus.INITIATED,
                paymentUrl,
                String.valueOf(paymentOrder.getId())
        );
    }

    private PaymentLinkResponse createCashOnDeliveryResponse(User user, Address shippingAddress) throws Exception {
        Cart cart = requireCart(user);
        Set<Order> orders = orderService.createOrder(
                user,
                shippingAddress,
                cart,
                com.example.ecommerce.common.domain.OrderStatus.PLACED,
                PaymentStatus.PENDING,
                PaymentMethod.COD,
                PaymentType.CASH,
                null
        );
        return buildPaymentResponse(
                orders,
                null,
                PaymentMethod.COD,
                PaymentType.CASH,
                null,
                PaymentStatus.PENDING,
                com.example.ecommerce.common.domain.OrderStatus.PLACED,
                null,
                null
        );
    }

    private PaymentMethod resolveCheckoutPaymentMethod(String paymentMethod) {
        if ("COD".equals(paymentMethod)) {
            return PaymentMethod.COD;
        }
        if ("PHONEPE".equals(paymentMethod) || "UPI".equals(paymentMethod) || "RAZORPAY".equals(paymentMethod)) {
            return PaymentMethod.UPI;
        }
        if ("STRIPE".equals(paymentMethod) || "CARD".equals(paymentMethod)) {
            return PaymentMethod.CARD;
        }
        throw new IllegalArgumentException("Unsupported payment method");
    }

    private PaymentLinkResponse buildPaymentResponse(
            Set<Order> orders,
            Long paymentOrderId,
            PaymentMethod paymentMethod,
            PaymentType paymentType,
            PaymentProvider provider,
            PaymentStatus paymentStatus,
            com.example.ecommerce.common.domain.OrderStatus orderStatus,
            String paymentUrl,
            String paymentReference
    ) {
        PaymentLinkResponse response = new PaymentLinkResponse();
        response.setOrderId(orders.size() == 1 ? orders.iterator().next().getId() : null);
        response.setPaymentOrderId(paymentOrderId);
        response.setPaymentMethod(paymentMethod);
        response.setPaymentType(paymentType);
        response.setProvider(provider);
        response.setPaymentStatus(paymentStatus);
        response.setOrderStatus(orderStatus);
        response.setPayment_link_url(paymentUrl);
        response.setPayment_link_id(paymentReference);
        return response;
    }
}
