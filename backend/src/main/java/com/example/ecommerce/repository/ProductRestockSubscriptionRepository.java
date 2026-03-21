package com.example.ecommerce.repository;

import com.example.ecommerce.modal.ProductRestockSubscription;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProductRestockSubscriptionRepository extends JpaRepository<ProductRestockSubscription, Long> {
    Optional<ProductRestockSubscription> findTopByProductIdAndUserIdOrderByCreatedAtDesc(Long productId, Long userId);

    List<ProductRestockSubscription> findByProductIdAndStatusOrderByCreatedAtAsc(Long productId, String status);
}
