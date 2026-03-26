package com.example.ecommerce.repository;

import com.example.ecommerce.modal.ProductTaxReview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ProductTaxReviewRepository extends JpaRepository<ProductTaxReview, Long> {
    Optional<ProductTaxReview> findByProductId(Long productId);

    List<ProductTaxReview> findByReviewStatusOrderByRequestedAtDesc(String reviewStatus);

    @Query("""
            select review
            from ProductTaxReview review
            join fetch review.product product
            where upper(review.reviewStatus) = upper(:reviewStatus)
            order by review.requestedAt desc
            """)
    List<ProductTaxReview> findByReviewStatusWithProductOrderByRequestedAtDesc(@Param("reviewStatus") String reviewStatus);

    @Query("""
            select review
            from ProductTaxReview review
            join fetch review.product product
            order by review.requestedAt desc
            """)
    List<ProductTaxReview> findAllWithProductOrderByRequestedAtDesc();
}
