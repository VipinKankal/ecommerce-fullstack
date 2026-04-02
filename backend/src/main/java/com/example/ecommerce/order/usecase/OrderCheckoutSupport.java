package com.example.ecommerce.order.usecase;

import com.example.ecommerce.common.domain.OrderStatus;
import com.example.ecommerce.common.domain.PaymentMethod;
import com.example.ecommerce.common.domain.PaymentProvider;
import com.example.ecommerce.common.domain.PaymentStatus;
import com.example.ecommerce.common.domain.PaymentType;
import com.example.ecommerce.modal.Order;
import com.example.ecommerce.order.response.PaymentLinkResponse;

import java.util.Set;

final class OrderCheckoutSupport {

    private OrderCheckoutSupport() {
    }

    static String normalizeCheckoutRequestId(String rawCheckoutRequestId) {
        if (rawCheckoutRequestId == null || rawCheckoutRequestId.isBlank()) {
            return null;
        }
        String trimmed = rawCheckoutRequestId.trim();
        return trimmed.length() > 120 ? trimmed.substring(0, 120) : trimmed;
    }

    static PaymentMethod resolveCheckoutPaymentMethod(String paymentMethod) {
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

    static PaymentLinkResponse buildPaymentResponse(
            Set<Order> orders,
            Long paymentOrderId,
            PaymentMethod paymentMethod,
            PaymentType paymentType,
            PaymentProvider provider,
            PaymentStatus paymentStatus,
            OrderStatus orderStatus,
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
