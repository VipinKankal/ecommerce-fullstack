package com.example.ecommerce.repository;

import com.example.ecommerce.modal.WarehouseTransferRequest;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WarehouseTransferRequestRepository extends JpaRepository<WarehouseTransferRequest, Long> {

    @Override
    @EntityGraph(attributePaths = {"product", "product.category", "seller"})
    List<WarehouseTransferRequest> findAll();

    @EntityGraph(attributePaths = {"product", "product.category", "seller"})
    List<WarehouseTransferRequest> findBySellerIdOrderByRequestedAtDesc(Long sellerId);

    @EntityGraph(attributePaths = {"product", "product.category", "seller"})
    List<WarehouseTransferRequest> findAllByOrderByRequestedAtDesc();
}
