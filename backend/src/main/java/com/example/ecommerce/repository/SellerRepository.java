package com.example.ecommerce.repository;

import com.example.ecommerce.common.domain.AccountStatus;
import com.example.ecommerce.modal.Seller;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SellerRepository extends JpaRepository<Seller,Long> {
    Seller findByEmail(String email);
    List<Seller> findByAccountStatus(AccountStatus status);
}



