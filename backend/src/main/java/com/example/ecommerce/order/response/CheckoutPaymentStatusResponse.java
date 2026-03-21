package com.example.ecommerce.order.response;

import com.example.ecommerce.common.domain.OrderStatus;
import com.example.ecommerce.common.domain.PaymentMethod;
import com.example.ecommerce.common.domain.PaymentProvider;
import com.example.ecommerce.common.domain.PaymentStatus;
import com.example.ecommerce.common.domain.PaymentType;
import lombok.Data;

@Data
public class CheckoutPaymentStatusResponse {
    private Long orderId;
    private Long paymentOrderId;
    private PaymentMethod paymentMethod;
    private PaymentType paymentType;
    private PaymentProvider provider;
    private PaymentStatus paymentStatus;
    private OrderStatus orderStatus;
    private String message;
}
