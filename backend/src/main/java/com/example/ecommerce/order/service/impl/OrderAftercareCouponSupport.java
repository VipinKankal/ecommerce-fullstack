package com.example.ecommerce.order.service.impl;

import com.example.ecommerce.modal.Order;
import com.example.ecommerce.modal.OrderItem;
import com.example.ecommerce.modal.OrderReturnExchangeRequest;
import com.example.ecommerce.order.service.CouponService;
import com.example.ecommerce.repository.OrderRepository;
import com.example.ecommerce.repository.OrderReturnExchangeRequestRepository;

import java.util.LinkedHashMap;
import java.util.List;

final class OrderAftercareCouponSupport {

    private OrderAftercareCouponSupport() {
    }

    static void restoreCouponForFullyReturnedOrder(
            OrderReturnExchangeRequest request,
            OrderRepository orderRepository,
            OrderReturnExchangeRequestRepository requestRepository,
            CouponService couponService
    ) {
        if (request == null || request.getOrderId() == null) {
            return;
        }
        Order order = orderRepository.findById(request.getOrderId()).orElse(null);
        if (order == null || order.getCouponCode() == null || order.getCouponCode().isBlank()) {
            return;
        }
        if (order.getOrderItems() == null || order.getOrderItems().isEmpty()) {
            return;
        }

        List<OrderReturnExchangeRequest> returnRequests = requestRepository
                .findByOrderIdAndRequestTypeOrderByRequestedAtDesc(order.getId(), "RETURN");
        if (returnRequests.isEmpty()) {
            return;
        }

        LinkedHashMap<Long, String> latestStatusByItem = new LinkedHashMap<>();
        for (OrderReturnExchangeRequest row : returnRequests) {
            if (row.getOrderItemId() == null || latestStatusByItem.containsKey(row.getOrderItemId())) {
                continue;
            }
            latestStatusByItem.put(
                    row.getOrderItemId(),
                    OrderAftercareValueSupport.normalizeType(row.getStatus())
            );
        }

        boolean allItemsReturned = order.getOrderItems().stream()
                .map(OrderItem::getId)
                .allMatch(itemId -> "RETURNED".equals(latestStatusByItem.get(itemId)));

        if (!allItemsReturned) {
            return;
        }

        couponService.restoreCouponUsageForCancelledOrders(
                order.getUser(),
                List.of(order),
                "Coupon restored after full order return and completed refund"
        );
    }
}
