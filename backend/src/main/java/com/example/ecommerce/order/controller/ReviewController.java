package com.example.ecommerce.order.controller;

import com.example.ecommerce.modal.Product;
import com.example.ecommerce.modal.Review;
import com.example.ecommerce.modal.User;
import com.example.ecommerce.order.request.CreateReviewRequest;
import com.example.ecommerce.common.response.ApiResponse;
import com.example.ecommerce.catalog.service.ProductService;
import com.example.ecommerce.order.service.ReviewService;
import com.example.ecommerce.user.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api")
public class ReviewController {

    private final ReviewService reviewService;
    private final UserService userService;
    private final ProductService productService;

    @PostMapping("/product/{productId}/reviews")
    @PreAuthorize("hasAnyRole('CUSTOMER','ADMIN')")
    public ResponseEntity<Review> createReview(
            @Valid @RequestBody CreateReviewRequest request,
            @PathVariable Long productId,
            @RequestHeader(value = "Authorization", required = false) String jwt
    ) throws Exception {

        User user = userService.findUserByJwtToken(jwt);
        Product product = productService.findProductById(productId);
        Review review = reviewService.createReview(request, user, product);
        return ResponseEntity.ok(review);
    }

    @GetMapping("/product/{productId}/reviews")
    public ResponseEntity<List<Review>> getReviewsByProduct(@PathVariable Long productId) {
        List<Review> reviews = reviewService.getReviewByProductId(productId);
        return ResponseEntity.ok(reviews);
    }

    @PatchMapping("/reviews/{reviewId}")
    @PreAuthorize("hasAnyRole('CUSTOMER','ADMIN')")
    public ResponseEntity<Review> updateReview(
            @PathVariable Long reviewId,
            @Valid @RequestBody CreateReviewRequest request,
            @RequestHeader(value = "Authorization", required = false) String jwt
    ) throws Exception {

        User user = userService.findUserByJwtToken(jwt);
        Review review = reviewService.updateReview(
                reviewId,
                request.getReviewText(),
                request.getReviewRating(),
                user.getId()
        );
        return ResponseEntity.ok(review);
    }

    @DeleteMapping("/reviews/{reviewId}")
    @PreAuthorize("hasAnyRole('CUSTOMER','ADMIN')")
    public ResponseEntity<ApiResponse> deleteReview(
            @PathVariable Long reviewId,
            @RequestHeader(value = "Authorization", required = false) String jwt
    ) throws Exception {

        User user = userService.findUserByJwtToken(jwt);
        reviewService.deleteReview(reviewId, user.getId());
        ApiResponse response = new ApiResponse();
        response.setMessage("Review deleted successfully");

        return ResponseEntity.ok(response);
    }
}





