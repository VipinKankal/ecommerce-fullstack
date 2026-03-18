package com.example.ecommerce.order.service;

import com.example.ecommerce.common.domain.OrderStatus;
import com.example.ecommerce.modal.*;

import java.util.List;
import java.util.Set;

public interface OrderService {
    Set<Order> createOrder(User user, Address shippingAddress, Cart cart);
    Order findOrderById(long id) throws Exception;
    List<Order> usersOrderHistory(Long userId);
    List<Order> sellersOrder(Long sellerId);
    Order updateOrderStatus(Long orderId, OrderStatus status) throws Exception;
    Order updateOrderStatusBySeller(Long orderId, OrderStatus status, Long sellerId) throws Exception;
    Order cancelOrder(Long orderId, User user, String cancelReasonCode, String cancelReasonText) throws Exception;
    OrderItem getOrderItemById(Long id) throws Exception;
}




