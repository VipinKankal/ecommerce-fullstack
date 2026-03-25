package com.example.ecommerce.repository;

import com.example.ecommerce.modal.Transaction;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TransactionRepository extends JpaRepository<Transaction,Long> {
    @EntityGraph(attributePaths = {"customer", "seller", "order"})
    List<Transaction> findBySellerId(Long sellerId);

    @EntityGraph(attributePaths = {"customer", "seller", "order"})
    Optional<Transaction> findByOrderId(Long orderId);

    @EntityGraph(attributePaths = {"customer", "seller", "order"})
    List<Transaction> findAllByOrderByDateDesc();
}
