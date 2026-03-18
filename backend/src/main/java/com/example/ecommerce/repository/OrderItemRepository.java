package com.example.ecommerce.repository;

import com.example.ecommerce.modal.OrderItem;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderItemRepository extends JpaRepository<OrderItem,Long> {

    @EntityGraph(attributePaths = {
            "order",
            "order.user",
            "product",
            "product.images"
    })
    java.util.Optional<OrderItem> findDetailedById(Long id);
}



