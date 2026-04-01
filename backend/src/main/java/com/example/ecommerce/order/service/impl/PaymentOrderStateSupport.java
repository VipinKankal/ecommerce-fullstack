package com.example.ecommerce.order.service.impl;

import com.example.ecommerce.common.domain.CouponReservationState;
import com.example.ecommerce.common.domain.OrderStatus;
import com.example.ecommerce.common.domain.PaymentOrderStatus;
import com.example.ecommerce.common.domain.PaymentStatus;
import com.example.ecommerce.modal.Order;
import com.example.ecommerce.modal.PaymentOrder;
import com.example.ecommerce.order.service.CouponService;
import com.example.ecommerce.repository.OrderRepository;

import java.util.Set;

final class PaymentOrderStateSupport {

    private PaymentOrderStateSupport() {
    }

    static boolean markRazorpayPaymentResult(
            PaymentOrder paymentOrder,
            String paymentLinkId,
            String paymentStatus,
            OrderRepository orderRepository,
            CouponService couponService
    ) throws com.razorpay.RazorpayException {
        if (paymentOrder.getStatus() != PaymentOrderStatus.PENDING) {
            return false;
        }
        if (paymentOrder.getPaymentLinkId() == null || !paymentOrder.getPaymentLinkId().equals(paymentLinkId)) {
            throw new com.razorpay.RazorpayException("Invalid payment link reference");
        }

        if ("captured".equals(paymentStatus)) {
            markOrdersPaid(paymentOrder.getOrders(), orderRepository);
            paymentOrder.setStatus(PaymentOrderStatus.SUCCESS);
            return true;
        }

        paymentOrder.setStatus(PaymentOrderStatus.FAILED);
        releaseReservationOnFailure(paymentOrder, couponService);
        return false;
    }

    static void applyPhonePeStatus(
            PaymentOrder paymentOrder,
            String phonePeStatus,
            OrderRepository orderRepository,
            CouponService couponService
    ) {
        if ("SUCCESS".equals(phonePeStatus)) {
            paymentOrder.setStatus(PaymentOrderStatus.SUCCESS);
            markOrdersPaid(paymentOrder.getOrders(), orderRepository);
            return;
        }
        if ("FAILED".equals(phonePeStatus)) {
            paymentOrder.setStatus(PaymentOrderStatus.FAILED);
            releaseReservationOnFailure(paymentOrder, couponService);
            markOrdersFailed(paymentOrder.getOrders(), orderRepository);
        }
    }

    private static void markOrdersPaid(Set<Order> orders, OrderRepository orderRepository) {
        for (Order order : orders) {
            order.setPaymentStatus(PaymentStatus.SUCCESS);
            if (order.getOrderStatus() == OrderStatus.INITIATED || order.getOrderStatus() == OrderStatus.PENDING) {
                order.setOrderStatus(OrderStatus.PLACED);
            }
            orderRepository.save(order);
        }
    }

    private static void markOrdersFailed(Set<Order> orders, OrderRepository orderRepository) {
        for (Order order : orders) {
            order.setPaymentStatus(PaymentStatus.FAILED);
            orderRepository.save(order);
        }
    }

    private static void releaseReservationOnFailure(PaymentOrder paymentOrder, CouponService couponService) {
        if (paymentOrder == null) {
            return;
        }
        if (paymentOrder.getCouponReservationState() != CouponReservationState.RESERVED) {
            return;
        }
        Order primaryOrder = paymentOrder.getOrders() == null
                ? null
                : paymentOrder.getOrders().stream()
                .min(java.util.Comparator.comparing(Order::getId, java.util.Comparator.nullsLast(Long::compareTo)))
                .orElse(null);
        String couponCode = primaryOrder == null ? null : primaryOrder.getCouponCode();
        couponService.releaseCouponReservation(
                couponCode,
                paymentOrder.getUser() == null ? null : paymentOrder.getUser().getId(),
                "PAYMENT_FAILED",
                "Coupon reservation released after payment failure"
        );
        paymentOrder.setCouponReservationState(CouponReservationState.RELEASED);
    }
}
