package com.example.ecommerce.repository;

import com.example.ecommerce.common.domain.OrderStatus;
import com.example.ecommerce.modal.OrderItem;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;

public interface OrderItemRepository extends JpaRepository<OrderItem,Long> {

    @EntityGraph(attributePaths = {
            "order",
            "order.user",
            "product",
            "product.images"
    })
    java.util.Optional<OrderItem> findDetailedById(Long id);

    boolean existsByProductIdAndOrderOrderStatusNotIn(
            Long productId,
            Collection<OrderStatus> statuses
    );
}



