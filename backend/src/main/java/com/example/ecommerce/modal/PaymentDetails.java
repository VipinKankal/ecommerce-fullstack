package com.example.ecommerce.modal;

import com.example.ecommerce.common.domain.PaymentStatus;
import com.example.ecommerce.common.persistence.PaymentStatusConverter;
import jakarta.persistence.Convert;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaymentDetails {
    private String paymentId;
    private String razorpayPaymentLinkId;
    private String razorpayPaymentLinkReferenceId;
    private String razorpayPaymentLinkStatus;
    private String razorpayPaymentId;

    @Convert(converter = PaymentStatusConverter.class)
    private PaymentStatus status;
}



