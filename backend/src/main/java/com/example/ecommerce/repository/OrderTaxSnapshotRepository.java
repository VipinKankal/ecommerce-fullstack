package com.example.ecommerce.repository;

import com.example.ecommerce.modal.OrderTaxSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface OrderTaxSnapshotRepository extends JpaRepository<OrderTaxSnapshot, Long> {
    Optional<OrderTaxSnapshot> findByOrderId(Long orderId);
}
