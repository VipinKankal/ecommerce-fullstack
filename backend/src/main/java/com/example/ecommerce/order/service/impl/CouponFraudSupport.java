package com.example.ecommerce.order.service.impl;

import com.example.ecommerce.common.domain.CouponEventType;
import com.example.ecommerce.order.exception.CouponOperationException;
import com.example.ecommerce.repository.CouponEventLogRepository;

import java.time.LocalDateTime;
import java.util.function.BiFunction;

final class CouponFraudSupport {

    private static final int MAX_COUPON_ATTEMPTS_PER_2_MIN = 20;
    private static final int MAX_COUPON_REJECTS_PER_10_MIN = 8;
    private static final int MAX_IP_REJECTS_PER_10_MIN = 16;
    private static final int MAX_DEVICE_REJECTS_PER_10_MIN = 12;
    private static final int MAX_DEVICE_ATTEMPTS_PER_2_MIN = 24;

    private CouponFraudSupport() {
    }

    static void enforceFraudThrottle(
            Long userId,
            String clientIp,
            String deviceId,
            CouponEventLogRepository couponEventLogRepository,
            BiFunction<String, String, CouponOperationException> validationErrorFactory
    ) {
        if (userId == null) {
            return;
        }
        LocalDateTime now = LocalDateTime.now();
        long recentAttempts = couponEventLogRepository.countByUserIdAndCreatedAtAfter(
                userId,
                now.minusMinutes(2)
        );
        if (recentAttempts >= MAX_COUPON_ATTEMPTS_PER_2_MIN) {
            throw validationErrorFactory.apply(
                    "COUPON_RATE_LIMIT",
                    "Too many coupon attempts. Please wait a moment before retrying."
            );
        }

        long recentRejects = couponEventLogRepository.countByUserIdAndEventTypeAndCreatedAtAfter(
                userId,
                CouponEventType.APPLY_REJECTED,
                now.minusMinutes(10)
        );
        if (recentRejects >= MAX_COUPON_REJECTS_PER_10_MIN) {
            throw validationErrorFactory.apply(
                    "COUPON_SUSPICIOUS_ACTIVITY",
                    "Coupon usage temporarily restricted due to repeated invalid attempts."
            );
        }

        String normalizedIp = clientIp == null ? null : clientIp.trim();
        if (normalizedIp != null && !normalizedIp.isBlank()) {
            String ipToken = "ip=" + normalizedIp;
            long ipRejects = couponEventLogRepository.countByEventTypeAndNoteContainingAndCreatedAtAfter(
                    CouponEventType.APPLY_REJECTED,
                    ipToken,
                    now.minusMinutes(10)
            );
            if (ipRejects >= MAX_IP_REJECTS_PER_10_MIN) {
                throw validationErrorFactory.apply(
                        "COUPON_IP_BLOCKED",
                        "Too many invalid coupon attempts from this network. Please retry later."
                );
            }
        }

        String normalizedDevice = deviceId == null ? null : deviceId.trim();
        if (normalizedDevice != null && !normalizedDevice.isBlank()) {
            String deviceToken = "device=" + normalizedDevice;
            long deviceRejects = couponEventLogRepository.countByEventTypeAndNoteContainingAndCreatedAtAfter(
                    CouponEventType.APPLY_REJECTED,
                    deviceToken,
                    now.minusMinutes(10)
            );
            if (deviceRejects >= MAX_DEVICE_REJECTS_PER_10_MIN) {
                throw validationErrorFactory.apply(
                        "COUPON_DEVICE_BLOCKED",
                        "Coupon activity from this device is temporarily restricted."
                );
            }

            long deviceAttempts = couponEventLogRepository.countByNoteContainingAndCreatedAtAfter(
                    deviceToken,
                    now.minusMinutes(2)
            );
            if (deviceAttempts >= MAX_DEVICE_ATTEMPTS_PER_2_MIN) {
                throw validationErrorFactory.apply(
                        "COUPON_DEVICE_RATE_LIMIT",
                        "Too many coupon attempts from this device. Please wait and try again."
                );
            }
        }
    }
}
