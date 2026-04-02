package com.example.ecommerce.order.service.impl;

import com.example.ecommerce.common.domain.OrderStatus;
import com.example.ecommerce.common.domain.PaymentMethod;
import com.example.ecommerce.common.domain.PaymentProvider;
import com.example.ecommerce.common.domain.PaymentStatus;
import com.example.ecommerce.common.domain.PaymentType;
import com.example.ecommerce.inventory.service.InventoryService;
import com.example.ecommerce.inventory.service.RestockNotificationService;
import com.example.ecommerce.modal.Address;
import com.example.ecommerce.modal.Cart;
import com.example.ecommerce.modal.CartItem;
import com.example.ecommerce.modal.Order;
import com.example.ecommerce.modal.OrderItem;
import com.example.ecommerce.modal.User;
import com.example.ecommerce.order.service.OrderService;
import com.example.ecommerce.order.service.OrderTaxSnapshotService;
import com.example.ecommerce.repository.AddressRepository;
import com.example.ecommerce.repository.CartRepository;
import com.example.ecommerce.repository.OrderItemRepository;
import com.example.ecommerce.repository.OrderRepository;
import com.example.ecommerce.repository.ProductRepository;
import com.example.ecommerce.repository.ProductVariantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final AddressRepository addressRepository;
    private final OrderItemRepository orderItemRepository;
    private final CartRepository cartRepository;
    private final InventoryService inventoryService;
    private final RestockNotificationService restockNotificationService;
    private final ProductVariantRepository productVariantRepository;
    private final ProductRepository productRepository;
    private final OrderTaxSnapshotService orderTaxSnapshotService;

    @Override
    @Transactional
    public Set<Order> createOrder(
            User user,
            Address shippingAddress,
            Cart cart,
            OrderStatus orderStatus,
            PaymentStatus paymentStatus,
            PaymentMethod paymentMethod,
            PaymentType paymentType,
            PaymentProvider provider
    ) {
        Address address = addressRepository.save(shippingAddress);
        Map<Long, List<CartItem>> itemsByBrand = OrderServiceSupport.groupItemsBySeller(cart);
        Set<Order> orders = new HashSet<>();
        List<Map.Entry<Long, List<CartItem>>> sellerEntries = new ArrayList<>(itemsByBrand.entrySet());
        int subtotalBeforeCoupon = OrderServiceSupport.calculateCartSubtotal(cart);
        double totalCouponDiscount = cart.getCouponDiscountAmount() == null ? 0.0 : cart.getCouponDiscountAmount();
        int remainingCouponDiscount = (int) Math.round(totalCouponDiscount);

        for (int index = 0; index < sellerEntries.size(); index++) {
            Map.Entry<Long, List<CartItem>> entry = sellerEntries.get(index);
            List<CartItem> items = entry.getValue();
            int sellerSubtotal = OrderServiceSupport.calculateSellerSubtotal(items);
            int sellerCouponDiscount = OrderServiceSupport.calculateCouponDiscountShare(index, sellerEntries.size(), sellerSubtotal, totalCouponDiscount, subtotalBeforeCoupon, remainingCouponDiscount);
            remainingCouponDiscount -= sellerCouponDiscount;

            Order savedOrder = saveSellerOrder(user, address, entry.getKey(), items, orderStatus, paymentStatus, paymentMethod, paymentType, provider, sellerSubtotal, sellerCouponDiscount, cart.getCouponCode());
            orders.add(savedOrder);

            List<OrderItem> orderItems = createAndPersistOrderItems(savedOrder, items);
            orderTaxSnapshotService.freezeSnapshot(savedOrder, orderItems, sellerCouponDiscount);
        }

        OrderServiceSupport.clearPurchasedCart(cart);
        cartRepository.save(cart);
        return orders;
    }

    @Override
    public Order findOrderById(long id) throws Exception {
        return orderRepository.findDetailedById(id).orElseThrow(() -> new Exception("Order not found"));
    }

    @Override
    public List<Order> usersOrderHistory(Long userId) {
        return orderRepository.findByUserId(userId);
    }

    @Override
    public List<Order> sellersOrder(Long sellerId) {
        return orderRepository.findBySellerId(sellerId);
    }

    @Override
    public Order updateOrderStatus(Long orderId, OrderStatus status) throws Exception {
        Order order = findOrderById(orderId);
        if (status == OrderStatus.DELIVERED && order.getDeliveredAt() == null) {
            order.setDeliveredAt(LocalDateTime.now());
        }
        order.setOrderStatus(status);
        return orderRepository.save(order);
    }

    @Override
    public Order updateOrderStatusByAdmin(Long orderId, OrderStatus status) throws Exception {
        Order order = findOrderById(orderId);
        OrderServiceSupport.validateAdminStatusTransition(order.getOrderStatus(), status);
        OrderServiceSupport.stampStatusTransition(order, status);
        return orderRepository.save(order);
    }

    @Override
    public Order updateOrderStatusBySeller(Long orderId, OrderStatus status, Long sellerId) throws Exception {
        throw new IllegalArgumentException("Seller order cancellation is disabled");
    }

    @Override
    public Order cancelOrder(Long orderId, User user, String cancelReasonCode, String cancelReasonText) throws Exception {
        Order order = findOrderById(orderId);
        if (!order.getUser().getId().equals(user.getId())) {
            throw new Exception("Unauthorized to cancel this order");
        }
        order.setOrderStatus(OrderStatus.CANCELLED);
        order.setCancelReasonCode(cancelReasonCode);
        order.setCancelReasonText(cancelReasonText);
        order.setCancelledAt(LocalDateTime.now());
        return orderRepository.save(order);
    }

    @Override
    @Transactional
    public Order cancelOrderByAdmin(Long orderId, String cancelReasonCode, String cancelReasonText) throws Exception {
        Order order = findOrderById(orderId);
        if (order.getOrderStatus() == OrderStatus.SHIPPED
                || order.getOrderStatus() == OrderStatus.OUT_FOR_DELIVERY
                || order.getOrderStatus() == OrderStatus.DELIVERED
                || order.getOrderStatus() == OrderStatus.CANCELLED) {
            throw new IllegalArgumentException("Order can be cancelled only before shipment");
        }

        order.setOrderStatus(OrderStatus.CANCELLED);
        order.setCancelReasonCode(cancelReasonCode);
        order.setCancelReasonText(cancelReasonText);
        order.setCancelledAt(LocalDateTime.now());

        if (order.getOrderItems() != null) {
            for (OrderItem orderItem : order.getOrderItems()) {
                OrderServiceSupport.restoreOrderItemStock(orderItem, productVariantRepository, productRepository, inventoryService);
            }
        }

        return orderRepository.save(order);
    }

    @Override
    public OrderItem getOrderItemById(Long id) throws Exception {
        return orderItemRepository.findDetailedById(id).orElseThrow(() -> new Exception("Order Item not found"));
    }

    private Order saveSellerOrder(
            User user,
            Address address,
            Long sellerId,
            List<CartItem> items,
            OrderStatus orderStatus,
            PaymentStatus paymentStatus,
            PaymentMethod paymentMethod,
            PaymentType paymentType,
            PaymentProvider provider,
            int sellerSubtotal,
            int sellerCouponDiscount,
            String couponCode
    ) {
        Order order = new Order();
        order.setUser(user);
        order.setSellerId(sellerId);
        order.setTotalMrpPrice(OrderServiceSupport.calculateSellerMrpTotal(items));
        order.setTotalSellingPrice(Math.max(0, sellerSubtotal - sellerCouponDiscount));
        order.setDiscount(sellerCouponDiscount);
        order.setCouponCode(couponCode);
        order.setTotalItems(OrderServiceSupport.calculateTotalItemCount(items));
        order.setShippingAddress(address);
        order.setOrderStatus(orderStatus);
        order.setPaymentStatus(paymentStatus);
        order.setPaymentMethod(paymentMethod);
        order.setPaymentType(paymentType);
        order.setProvider(provider);
        return orderRepository.save(order);
    }

    private List<OrderItem> createAndPersistOrderItems(Order savedOrder, List<CartItem> items) {
        List<OrderItem> orderItems = new ArrayList<>();
        for (CartItem item : items) {
            OrderItem orderItem = OrderServiceSupport.createOrderItem(savedOrder, item);
            OrderItem savedOrderItem = OrderServiceSupport.persistAndAllocateOrderItem(orderItem, orderItemRepository, productVariantRepository, productRepository, inventoryService, restockNotificationService);
            orderItems.add(savedOrderItem);
        }
        return orderItems;
    }
}
