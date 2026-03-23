package com.example.ecommerce.repository;

import com.example.ecommerce.modal.CouponEventLog;
import com.example.ecommerce.common.domain.CouponEventType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;

public interface CouponEventLogRepository extends JpaRepository<CouponEventLog, Long> {
    long countByEventTypeAndCreatedAtAfter(CouponEventType eventType, LocalDateTime createdAt);

    long countByCouponIdAndEventTypeAndCreatedAtAfter(Long couponId, CouponEventType eventType, LocalDateTime createdAt);

    long countByUserIdAndEventTypeAndCreatedAtAfter(Long userId, CouponEventType eventType, LocalDateTime createdAt);

    long countByUserIdAndCreatedAtAfter(Long userId, LocalDateTime createdAt);

    long countByEventTypeAndNoteContainingAndCreatedAtAfter(
            CouponEventType eventType,
            String note,
            LocalDateTime createdAt
    );

    long countByNoteContainingAndCreatedAtAfter(String note, LocalDateTime createdAt);
}
