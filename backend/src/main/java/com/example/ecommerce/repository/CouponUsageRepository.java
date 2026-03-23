package com.example.ecommerce.repository;

import com.example.ecommerce.modal.CouponUsage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.Optional;

public interface CouponUsageRepository extends JpaRepository<CouponUsage, Long> {
    long countByCouponIdAndUserId(Long couponId, Long userId);

    boolean existsByCouponIdAndOrderId(Long couponId, Long orderId);

    Optional<CouponUsage> findByCouponIdAndOrderId(Long couponId, Long orderId);

    long countByUsedAtAfter(LocalDateTime usedAt);

    @Query("select coalesce(sum(cu.discountAmount), 0) from CouponUsage cu where cu.usedAt >= :usedAt")
    Double sumDiscountAmountByUsedAtAfter(LocalDateTime usedAt);
}
