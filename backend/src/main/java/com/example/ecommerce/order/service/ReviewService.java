package com.example.ecommerce.order.service;

import com.example.ecommerce.modal.Product;
import com.example.ecommerce.modal.Review;
import com.example.ecommerce.modal.User;
import com.example.ecommerce.order.request.CreateReviewRequest;

import java.util.List;

public interface ReviewService {
    Review createReview(CreateReviewRequest request,
                        User user,
                        Product product);
    List<Review>getReviewByProductId(Long productId);
    Review updateReview(Long reviewId,String reviewText,double rating,Long userId) throws Exception;
    void deleteReview(Long reviewId,Long userId) throws Exception;
    Review getReviewById(Long reviewId) throws Exception;
}




