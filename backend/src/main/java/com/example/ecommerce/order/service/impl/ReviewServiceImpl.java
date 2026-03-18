package com.example.ecommerce.order.service.impl;

import com.example.ecommerce.modal.Product;
import com.example.ecommerce.modal.Review;
import com.example.ecommerce.modal.User;
import com.example.ecommerce.repository.ReviewRepository;
import com.example.ecommerce.order.request.CreateReviewRequest;
import com.example.ecommerce.order.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ReviewServiceImpl implements ReviewService {

    private final ReviewRepository reviewRepository;

    @Override
    public Review createReview(CreateReviewRequest request, User user, Product product) {
        validateRating(request.getReviewRating());

        Review review = new Review();
        review.setUser(user);
        review.setProduct(product);
        review.setReviewerText(request.getReviewText());
        review.setRating(request.getReviewRating());
        review.setProductImages(request.getProductImages());
        product.getReviews().add(review);
        return reviewRepository.save(review);
    }

    @Override
    public List<Review> getReviewByProductId(Long productId) {
        return reviewRepository.findByProductId(productId);
    }

    @Override
    public Review updateReview(Long reviewId, String reviewText, double rating, Long userId) throws Exception {
        validateRating(rating);

        Review review = getReviewById(reviewId);
        if (review.getUser().getId().equals(userId)) {
            review.setReviewerText(reviewText);
            review.setRating(rating);
            return reviewRepository.save(review);
        }
        throw new Exception("you can't update this review");
    }

    @Override
    public void deleteReview(Long reviewId, Long userId) throws Exception {
        Review review = getReviewById(reviewId);
        if (!review.getUser().getId().equals(userId)) {
            throw new Exception("you can't delete this review");
        }
        reviewRepository.delete(review);
    }

    @Override
    public Review getReviewById(Long reviewId) throws Exception {
        return reviewRepository.findById(reviewId).orElseThrow(() ->
                new Exception("review not fount"));
    }

    private void validateRating(double rating) {
        if (rating < 1.0 || rating > 5.0) {
            throw new IllegalArgumentException("Review rating must be between 1 and 5");
        }
    }
}






