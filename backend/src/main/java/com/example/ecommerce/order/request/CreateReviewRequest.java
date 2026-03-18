package com.example.ecommerce.order.request;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.List;

@Data
public class CreateReviewRequest {
    @NotBlank(message = "Review text is required")
    private String reviewText;

    @DecimalMin(value = "1.0", message = "Review rating must be at least 1")
    @DecimalMax(value = "5.0", message = "Review rating must be at most 5")
    private double reviewRating;

    private List<String> productImages;
}




