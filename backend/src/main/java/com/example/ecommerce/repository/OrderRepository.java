package com.example.ecommerce.repository;

import com.example.ecommerce.modal.Order;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OrderRepository extends JpaRepository<Order , Long> {

    @EntityGraph(attributePaths = {"user", "shippingAddress", "orderItems", "orderItems.product", "orderItems.product.images"})
    List<Order> findByUserId(Long userId);

    @EntityGraph(attributePaths = {"user", "shippingAddress", "orderItems", "orderItems.product", "orderItems.product.images"})
    List<Order> findBySellerId(Long sellerId);

    @EntityGraph(attributePaths = {
            "user",
            "shippingAddress",
            "orderItems",
            "orderItems.product",
            "orderItems.product.images",
            "orderItems.product.seller",
            "orderItems.product.category"
    })
    List<Order> findAllByOrderByOrderDateDesc();

    @EntityGraph(attributePaths = {
            "user",
            "shippingAddress",
            "orderItems",
            "orderItems.product",
            "orderItems.product.images"
    })
    java.util.Optional<Order> findDetailedById(Long id);

    @EntityGraph(attributePaths = {
            "user",
            "shippingAddress",
            "orderItems",
            "orderItems.product",
            "orderItems.product.images"
    })
    java.util.Optional<Order> findDetailedByIdAndSellerId(Long id, Long sellerId);

    long countByUserId(Long userId);

    java.util.Optional<Order> findTopByUserIdOrderByOrderDateDesc(Long userId);
}
