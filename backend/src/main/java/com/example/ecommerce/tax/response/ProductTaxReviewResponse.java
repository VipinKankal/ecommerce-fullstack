package com.example.ecommerce.tax.response;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ProductTaxReviewResponse {
    private Long id;
    private Long productId;
    private String productTitle;
    private String suggestedHsnCode;
    private String requestedHsnCode;
    private String overrideReason;
    private String reviewStatus;
    private String reviewerNote;
    private LocalDateTime requestedAt;
    private LocalDateTime reviewedAt;
}
