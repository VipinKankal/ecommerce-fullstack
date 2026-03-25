package com.example.ecommerce.repository;

import com.example.ecommerce.modal.OrderSettlement;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface OrderSettlementRepository extends JpaRepository<OrderSettlement, Long> {

    @EntityGraph(attributePaths = {"order", "paymentOrder", "seller"})
    Optional<OrderSettlement> findByOrderId(Long orderId);

    @EntityGraph(attributePaths = {"order", "paymentOrder", "seller"})
    List<OrderSettlement> findBySellerIdOrderByCreatedAtDesc(Long sellerId);

    @EntityGraph(attributePaths = {"order", "paymentOrder", "seller"})
    List<OrderSettlement> findAllByOrderByCreatedAtDesc();
}
