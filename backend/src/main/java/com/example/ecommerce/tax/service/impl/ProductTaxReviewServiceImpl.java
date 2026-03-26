package com.example.ecommerce.tax.service.impl;

import com.example.ecommerce.modal.Product;
import com.example.ecommerce.modal.ProductTaxReview;
import com.example.ecommerce.repository.ProductRepository;
import com.example.ecommerce.repository.ProductTaxReviewRepository;
import com.example.ecommerce.tax.service.ProductTaxReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductTaxReviewServiceImpl implements ProductTaxReviewService {

    private final ProductTaxReviewRepository productTaxReviewRepository;
    private final ProductRepository productRepository;

    @Override
    @Transactional
    public ProductTaxReview upsertPendingReview(
            Product product,
            String suggestedHsnCode,
            String requestedHsnCode,
            String overrideReason
    ) {
        if (product == null || product.getId() == null) {
            throw new IllegalArgumentException("Product must be persisted before tax review can be created");
        }

        ProductTaxReview review = productTaxReviewRepository.findByProductId(product.getId())
                .orElseGet(ProductTaxReview::new);
        review.setProduct(product);
        review.setSuggestedHsnCode(normalizeNullable(suggestedHsnCode));
        review.setRequestedHsnCode(normalizeNullable(requestedHsnCode));
        review.setOverrideReason(trimToNull(overrideReason));
        review.setReviewStatus("PENDING_REVIEW");
        review.setReviewerNote(null);
        review.setRequestedAt(LocalDateTime.now());
        review.setReviewedAt(null);

        product.setTaxReviewStatus("PENDING_REVIEW");
        product.setActive(false);
        productRepository.save(product);
        return productTaxReviewRepository.save(review);
    }

    @Override
    @Transactional
    public ProductTaxReview review(Long reviewId, String reviewStatus, String reviewerNote) {
        ProductTaxReview review = productTaxReviewRepository.findById(reviewId)
                .orElseThrow(() -> new IllegalArgumentException("Product tax review not found"));
        Product product = review.getProduct();
        String normalizedStatus = normalizeReviewStatus(reviewStatus);

        review.setReviewStatus(normalizedStatus);
        review.setReviewerNote(trimToNull(reviewerNote));
        review.setReviewedAt(LocalDateTime.now());

        if ("APPROVED".equals(normalizedStatus)) {
            product.setTaxReviewStatus("APPROVED");
            if (review.getRequestedHsnCode() != null) {
                product.setHsnCode(review.getRequestedHsnCode());
                product.setHsnSelectionMode("SELLER_OVERRIDE");
            }
            product.setActive(true);
        } else if ("REJECTED".equals(normalizedStatus)) {
            product.setTaxReviewStatus("REJECTED");
            product.setHsnCode(review.getSuggestedHsnCode());
            product.setActive(false);
        } else {
            product.setTaxReviewStatus("PENDING_REVIEW");
            product.setActive(false);
        }

        productRepository.save(product);
        return productTaxReviewRepository.save(review);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductTaxReview> getReviews(String reviewStatus) {
        String normalizedStatus = normalizeNullable(reviewStatus);
        if (normalizedStatus == null) {
            return productTaxReviewRepository.findAllWithProductOrderByRequestedAtDesc();
        }
        return productTaxReviewRepository.findByReviewStatusWithProductOrderByRequestedAtDesc(normalizedStatus);
    }

    @Override
    @Transactional
    public void clearReviewForProduct(Long productId) {
        productTaxReviewRepository.findByProductId(productId)
                .ifPresent(productTaxReviewRepository::delete);
    }

    private String normalizeReviewStatus(String reviewStatus) {
        String normalized = normalizeNullable(reviewStatus);
        if (normalized == null) {
            throw new IllegalArgumentException("Review status is required");
        }
        if (!List.of("PENDING_REVIEW", "APPROVED", "REJECTED").contains(normalized)) {
            throw new IllegalArgumentException("Unsupported review status");
        }
        return normalized;
    }

    private String normalizeNullable(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isBlank() ? null : trimmed.toUpperCase();
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isBlank() ? null : trimmed;
    }
}
