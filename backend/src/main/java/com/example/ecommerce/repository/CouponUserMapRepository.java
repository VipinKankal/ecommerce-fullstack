package com.example.ecommerce.repository;

import com.example.ecommerce.modal.CouponUserMap;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CouponUserMapRepository extends JpaRepository<CouponUserMap, Long> {
    boolean existsByCouponIdAndUserId(Long couponId, Long userId);
    long countByCouponId(Long couponId);
    void deleteByCouponId(Long couponId);
}

