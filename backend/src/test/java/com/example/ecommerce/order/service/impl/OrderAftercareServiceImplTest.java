package com.example.ecommerce.order.service.impl;

import com.example.ecommerce.modal.Order;
import com.example.ecommerce.modal.OrderItem;
import com.example.ecommerce.modal.OrderReturnExchangeRequest;
import com.example.ecommerce.modal.User;
import com.example.ecommerce.order.service.CouponService;
import com.example.ecommerce.repository.OrderItemRepository;
import com.example.ecommerce.repository.OrderRepository;
import com.example.ecommerce.repository.OrderReturnExchangeRequestRepository;
import com.example.ecommerce.repository.ProductRepository;
import com.example.ecommerce.inventory.service.InventoryService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrderAftercareServiceImplTest {

    @Mock
    private OrderItemRepository orderItemRepository;
    @Mock
    private OrderReturnExchangeRequestRepository requestRepository;
    @Mock
    private OrderRepository orderRepository;
    @Mock
    private ProductRepository productRepository;
    @Mock
    private InventoryService inventoryService;
    @Mock
    private CouponService couponService;

    @InjectMocks
    private OrderAftercareServiceImpl orderAftercareService;

    @Test
    void completeRefundRestoresCouponWhenEntireOrderIsReturned() throws Exception {
        User user = new User();
        user.setId(10L);

        OrderItem item1 = new OrderItem();
        item1.setId(1L);
        OrderItem item2 = new OrderItem();
        item2.setId(2L);

        Order order = new Order();
        order.setId(900L);
        order.setUser(user);
        order.setCouponCode("SAVE10");
        order.setOrderItems(List.of(item1, item2));

        OrderReturnExchangeRequest refundRequest = new OrderReturnExchangeRequest();
        refundRequest.setId(500L);
        refundRequest.setOrderId(900L);
        refundRequest.setOrderItemId(1L);
        refundRequest.setRequestType("RETURN");
        refundRequest.setStatus("REFUND_INITIATED");

        OrderReturnExchangeRequest latestItem1 = new OrderReturnExchangeRequest();
        latestItem1.setOrderItemId(1L);
        latestItem1.setStatus("RETURNED");

        OrderReturnExchangeRequest latestItem2 = new OrderReturnExchangeRequest();
        latestItem2.setOrderItemId(2L);
        latestItem2.setStatus("RETURNED");

        when(requestRepository.findById(500L)).thenReturn(Optional.of(refundRequest));
        when(requestRepository.save(any(OrderReturnExchangeRequest.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(orderRepository.findById(900L)).thenReturn(Optional.of(order));
        when(requestRepository.findByOrderIdAndRequestTypeOrderByRequestedAtDesc(900L, "RETURN"))
                .thenReturn(List.of(latestItem1, latestItem2));

        orderAftercareService.completeRefund(500L, "done");

        verify(couponService).restoreCouponUsageForCancelledOrders(
                eq(user),
                any(),
                eq("Coupon restored after full order return and completed refund")
        );
    }

    @Test
    void completeRefundSkipsCouponRestoreForPartialReturn() throws Exception {
        User user = new User();
        user.setId(10L);

        OrderItem item1 = new OrderItem();
        item1.setId(1L);
        OrderItem item2 = new OrderItem();
        item2.setId(2L);

        Order order = new Order();
        order.setId(900L);
        order.setUser(user);
        order.setCouponCode("SAVE10");
        order.setOrderItems(List.of(item1, item2));

        OrderReturnExchangeRequest refundRequest = new OrderReturnExchangeRequest();
        refundRequest.setId(500L);
        refundRequest.setOrderId(900L);
        refundRequest.setOrderItemId(1L);
        refundRequest.setRequestType("RETURN");
        refundRequest.setStatus("REFUND_INITIATED");

        OrderReturnExchangeRequest latestItem1 = new OrderReturnExchangeRequest();
        latestItem1.setOrderItemId(1L);
        latestItem1.setStatus("RETURNED");

        OrderReturnExchangeRequest latestItem2 = new OrderReturnExchangeRequest();
        latestItem2.setOrderItemId(2L);
        latestItem2.setStatus("REFUND_INITIATED");

        when(requestRepository.findById(500L)).thenReturn(Optional.of(refundRequest));
        when(requestRepository.save(any(OrderReturnExchangeRequest.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(orderRepository.findById(900L)).thenReturn(Optional.of(order));
        when(requestRepository.findByOrderIdAndRequestTypeOrderByRequestedAtDesc(900L, "RETURN"))
                .thenReturn(List.of(latestItem1, latestItem2));

        orderAftercareService.completeRefund(500L, "done");

        verify(couponService, never()).restoreCouponUsageForCancelledOrders(any(), any(), any());
    }
}

