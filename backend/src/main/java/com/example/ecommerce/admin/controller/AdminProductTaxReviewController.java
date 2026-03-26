package com.example.ecommerce.admin.controller;

import com.example.ecommerce.modal.ProductTaxReview;
import com.example.ecommerce.tax.request.ReviewProductTaxRequest;
import com.example.ecommerce.tax.response.ProductTaxReviewResponse;
import com.example.ecommerce.tax.service.ProductTaxReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin/product-tax-reviews")
@PreAuthorize("hasRole('ADMIN')")
public class AdminProductTaxReviewController {

    private final ProductTaxReviewService productTaxReviewService;

    @GetMapping
    public ResponseEntity<List<ProductTaxReviewResponse>> getReviews(
            @RequestParam(required = false) String reviewStatus
    ) {
        return ResponseEntity.ok(
                productTaxReviewService.getReviews(reviewStatus).stream()
                        .map(this::toResponse)
                        .toList()
        );
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ProductTaxReviewResponse> review(
            @PathVariable Long id,
            @Valid @RequestBody ReviewProductTaxRequest request
    ) {
        return ResponseEntity.ok(
                toResponse(productTaxReviewService.review(id, request.getReviewStatus(), request.getReviewerNote()))
        );
    }

    private ProductTaxReviewResponse toResponse(ProductTaxReview review) {
        ProductTaxReviewResponse response = new ProductTaxReviewResponse();
        response.setId(review.getId());
        response.setProductId(review.getProduct() == null ? null : review.getProduct().getId());
        response.setProductTitle(review.getProduct() == null ? null : review.getProduct().getTitle());
        response.setSuggestedHsnCode(review.getSuggestedHsnCode());
        response.setRequestedHsnCode(review.getRequestedHsnCode());
        response.setOverrideReason(review.getOverrideReason());
        response.setReviewStatus(review.getReviewStatus());
        response.setReviewerNote(review.getReviewerNote());
        response.setRequestedAt(review.getRequestedAt());
        response.setReviewedAt(review.getReviewedAt());
        return response;
    }
}
