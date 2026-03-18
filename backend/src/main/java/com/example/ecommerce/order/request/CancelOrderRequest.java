package com.example.ecommerce.order.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CancelOrderRequest {

    @NotBlank(message = "cancelReasonCode is required")
    private String cancelReasonCode;

    private String cancelReasonText;
}




