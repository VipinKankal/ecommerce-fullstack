package com.example.ecommerce.tax.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ReviewProductTaxRequest {

    @NotBlank(message = "Review status is required")
    private String reviewStatus;

    private String reviewerNote;
}
