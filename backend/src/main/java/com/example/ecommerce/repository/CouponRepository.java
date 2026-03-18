package com.example.ecommerce.repository;

import com.example.ecommerce.modal.Coupon;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CouponRepository extends JpaRepository<Coupon,Long> {
    Coupon findByCode(String code);
}



