package com.example.ecommerce.order.request;

import com.example.ecommerce.modal.Address;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CheckoutOrderSummaryRequest {

    @Valid
    @NotNull(message = "shippingAddress is required")
    private Address shippingAddress;
}
