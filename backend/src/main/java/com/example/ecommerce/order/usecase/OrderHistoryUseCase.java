package com.example.ecommerce.order.usecase;

import com.example.ecommerce.common.domain.UserRole;
import com.example.ecommerce.modal.Order;
import com.example.ecommerce.modal.OrderItem;
import com.example.ecommerce.modal.User;
import com.example.ecommerce.order.response.OrderHistoryItemResponse;
import com.example.ecommerce.order.response.OrderHistoryResponse;
import com.example.ecommerce.order.service.OrderService;
import com.example.ecommerce.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class OrderHistoryUseCase {

    private final OrderService orderService;
    private final UserService userService;
    private final OrderHistoryResponseMapper orderHistoryResponseMapper;

    public List<OrderHistoryResponse> getUserOrderHistory(String jwt) throws Exception {
        User user = userService.findUserByJwtToken(jwt);
        List<Order> orders = orderService.usersOrderHistory(user.getId());
        return orders.stream().map(orderHistoryResponseMapper::toOrderHistoryResponse).toList();
    }

    public OrderHistoryResponse getOrderById(Long orderId, String jwt) throws Exception {
        User user = userService.findUserByJwtToken(jwt);
        Order order = orderService.findOrderById(orderId);

        if (user.getRole() != UserRole.ROLE_ADMIN && (order.getUser() == null || !order.getUser().getId().equals(user.getId()))) {
            throw new AccessDeniedException("Unauthorized order access");
        }

        return orderHistoryResponseMapper.toOrderHistoryResponse(order);
    }

    public OrderHistoryItemResponse getOrderItemById(Long orderItemId, String jwt) throws Exception {
        User user = userService.findUserByJwtToken(jwt);
        OrderItem orderItem = orderService.getOrderItemById(orderItemId);

        if (user.getRole() != UserRole.ROLE_ADMIN && (orderItem.getOrder() == null || orderItem.getOrder().getUser() == null
                || !orderItem.getOrder().getUser().getId().equals(user.getId()))) {
            throw new AccessDeniedException("Unauthorized order item access");
        }

        return orderHistoryResponseMapper.toOrderItemResponse(orderItem);
    }
}

