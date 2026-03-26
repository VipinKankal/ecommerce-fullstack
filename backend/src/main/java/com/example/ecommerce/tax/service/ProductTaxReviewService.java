package com.example.ecommerce.tax.service;

import com.example.ecommerce.modal.Product;
import com.example.ecommerce.modal.ProductTaxReview;

import java.util.List;

public interface ProductTaxReviewService {
    ProductTaxReview upsertPendingReview(
            Product product,
            String suggestedHsnCode,
            String requestedHsnCode,
            String overrideReason
    );

    ProductTaxReview review(Long reviewId, String reviewStatus, String reviewerNote);

    List<ProductTaxReview> getReviews(String reviewStatus);

    void clearReviewForProduct(Long productId);
}
