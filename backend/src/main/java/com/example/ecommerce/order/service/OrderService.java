package com.example.ecommerce.order.service;

import com.example.ecommerce.common.domain.OrderStatus;
import com.example.ecommerce.common.domain.PaymentMethod;
import com.example.ecommerce.common.domain.PaymentProvider;
import com.example.ecommerce.common.domain.PaymentStatus;
import com.example.ecommerce.common.domain.PaymentType;
import com.example.ecommerce.modal.*;

import java.util.List;
import java.util.Set;

public interface OrderService {
    Set<Order> createOrder(
            User user,
            Address shippingAddress,
            Cart cart,
            OrderStatus orderStatus,
            PaymentStatus paymentStatus,
            PaymentMethod paymentMethod,
            PaymentType paymentType,
            PaymentProvider provider
    );
    Order findOrderById(long id) throws Exception;
    List<Order> usersOrderHistory(Long userId);
    List<Order> sellersOrder(Long sellerId);
    Order updateOrderStatus(Long orderId, OrderStatus status) throws Exception;
    Order updateOrderStatusBySeller(Long orderId, OrderStatus status, Long sellerId) throws Exception;
    Order cancelOrder(Long orderId, User user, String cancelReasonCode, String cancelReasonText) throws Exception;
    OrderItem getOrderItemById(Long id) throws Exception;
}




