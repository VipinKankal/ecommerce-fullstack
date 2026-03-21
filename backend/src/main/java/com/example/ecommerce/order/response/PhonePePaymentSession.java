package com.example.ecommerce.order.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PhonePePaymentSession {
    private String merchantTransactionId;
    private String redirectUrl;
}
