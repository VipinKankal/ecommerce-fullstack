package com.example.ecommerce.order.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AddItemRequest {
    @NotBlank(message = "Size is required")
    private String size;

    @Min(value = 1, message = "Quantity must be at least 1")
    private int quantity;

    @NotNull(message = "Product id is required")
    private Long productId;
}




