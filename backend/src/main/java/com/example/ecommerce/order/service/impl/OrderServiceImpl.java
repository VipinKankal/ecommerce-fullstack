package com.example.ecommerce.order.service.impl;

import com.example.ecommerce.common.domain.OrderStatus;
import com.example.ecommerce.common.domain.PaymentMethod;
import com.example.ecommerce.common.domain.PaymentProvider;
import com.example.ecommerce.common.domain.PaymentStatus;
import com.example.ecommerce.common.domain.PaymentType;
import com.example.ecommerce.inventory.service.InventoryService;
import com.example.ecommerce.inventory.service.RestockNotificationService;
import com.example.ecommerce.modal.*;
import com.example.ecommerce.repository.AddressRepository;
import com.example.ecommerce.repository.CartRepository;
import com.example.ecommerce.repository.OrderItemRepository;
import com.example.ecommerce.repository.OrderRepository;
import com.example.ecommerce.repository.ProductRepository;
import com.example.ecommerce.repository.ProductVariantRepository;
import com.example.ecommerce.order.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

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
        // brand 1 == 4 shirts
        // brand 2 == 3 pants
        // brand 3 == 1 watch

        Map<Long, List<CartItem>> itemsByBrand = cart.getCartItems().stream()
                .collect(Collectors.groupingBy(item -> item.getProduct().getSeller().getId()));
        Set<Order> orders = new HashSet<>();
        for (Map.Entry<Long,List<CartItem>>entry:itemsByBrand.entrySet()){
            Long sellerId=entry.getKey();
            List<CartItem> items=entry.getValue();
            int totalOrderPrice = items.stream().mapToInt(
                    CartItem::getSellingPrice
            ).sum();
            int totalItem = items.stream().mapToInt(
                    CartItem::getQuantity
            ).sum();
            Order createOrder = new Order();
            createOrder.setUser(user);
            createOrder.setSellerId(sellerId);
            createOrder.setTotalMrpPrice(totalOrderPrice);
            createOrder.setTotalSellingPrice(totalOrderPrice);
            createOrder.setTotalItems(totalItem);
            createOrder.setShippingAddress(address);
            createOrder.setOrderStatus(orderStatus);
            createOrder.setPaymentStatus(paymentStatus);
            createOrder.setPaymentMethod(paymentMethod);
            createOrder.setPaymentType(paymentType);
            createOrder.setProvider(provider);

            Order savedOrder = orderRepository.save(createOrder);
            orders.add(savedOrder);

            List<OrderItem> orderItems = new ArrayList<>();
            for(CartItem item:items){
                OrderItem orderItem = new OrderItem();
                orderItem.setOrder(savedOrder);
                orderItem.setMrpPrice(item.getMrpPrice());
                orderItem.setProduct(item.getProduct());
                orderItem.setQuantity(item.getQuantity());
                orderItem.setSize(item.getSize());
                orderItem.setUserId(item.getUserId());
                orderItem.setSellingPrice(item.getSellingPrice());
                savedOrder.getOrderItems().add(orderItem);
                OrderItem savedOrderItem = orderItemRepository.save(orderItem);
                deductVariantWarehouseStock(item.getProduct(), item.getSize(), item.getQuantity());
                inventoryService.deductWarehouseStockForOrder(
                        item.getProduct(),
                        item.getQuantity(),
                        savedOrderItem.getId()
                );
                restockNotificationService.markSubscriptionConverted(user, item.getProduct());
                orderItems.add(savedOrderItem);
            }
        }

        // Once order is created, clear purchased items from cart.
        cart.getCartItems().clear();
        cart.setTotalItems(0);
        cart.setTotalMrpPrice(0);
        cart.setTotalSellingPrice(0);
        cart.setDiscount(0);
        cart.setCouponCode(null);
        cartRepository.save(cart);

        return orders;
    }

    @Override
    public Order findOrderById(long id) throws Exception {
        return orderRepository.findDetailedById(id).orElseThrow(
                () -> new Exception("Order not found"));
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
        order.setOrderStatus(status);
        if (status == OrderStatus.DELIVERED && order.getDeliveredAt() == null) {
            order.setDeliveredAt(LocalDateTime.now());
        }
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
        order.setCancelledAt(java.time.LocalDateTime.now());
        return orderRepository.save(order);
    }

    @Override
    public OrderItem getOrderItemById(Long id) throws Exception {
        return orderItemRepository.findDetailedById(id).orElseThrow(
                () -> new Exception("Order Item not found"));
    }

    private void deductVariantWarehouseStock(Product product, String size, int quantity) {
        if (product == null || product.getId() == null || size == null || size.isBlank()) {
            return;
        }
        productVariantRepository.findByProductIdAndSizeIgnoreCase(product.getId(), size.trim())
                .ifPresent(variant -> {
                    int available = Math.max(variant.getWarehouseStock() == null ? 0 : variant.getWarehouseStock(), 0);
                    if (available < quantity) {
                        throw new IllegalArgumentException("Selected size is not available in requested quantity");
                    }
                    variant.setWarehouseStock(available - quantity);
                    productVariantRepository.save(variant);
                    productRepository.save(product);
                });
    }
}







