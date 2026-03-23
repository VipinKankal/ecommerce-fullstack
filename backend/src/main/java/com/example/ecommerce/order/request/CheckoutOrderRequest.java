package com.example.ecommerce.order.request;

import com.example.ecommerce.modal.Address;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CheckoutOrderRequest {
    @Valid
    @NotNull(message = "shippingAddress is required")
    private Address shippingAddress;

    @NotBlank(message = "paymentMethod is required")
    private String paymentMethod;

    private String checkoutRequestId;
}
