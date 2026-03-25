package com.example.ecommerce.repository;

import com.example.ecommerce.modal.SettlementLedgerEntry;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SettlementLedgerEntryRepository extends JpaRepository<SettlementLedgerEntry, Long> {

    @EntityGraph(attributePaths = {"settlement", "order", "paymentOrder", "seller"})
    List<SettlementLedgerEntry> findBySellerIdOrderByCreatedAtDesc(Long sellerId);

    @EntityGraph(attributePaths = {"settlement", "order", "paymentOrder", "seller"})
    List<SettlementLedgerEntry> findByOrderIdOrderByCreatedAtDesc(Long orderId);

    @EntityGraph(attributePaths = {"settlement", "order", "paymentOrder", "seller"})
    List<SettlementLedgerEntry> findAllByOrderByCreatedAtDesc();
}
