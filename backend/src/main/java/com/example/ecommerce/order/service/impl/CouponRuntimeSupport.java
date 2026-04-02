package com.example.ecommerce.order.service.impl;

import com.example.ecommerce.common.domain.CouponEventType;
import com.example.ecommerce.modal.Coupon;
import com.example.ecommerce.modal.CouponEventLog;
import com.example.ecommerce.order.exception.CouponOperationException;
import com.example.ecommerce.repository.CouponEventLogRepository;
import com.example.ecommerce.repository.CouponRepository;

import java.time.LocalDateTime;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.atomic.AtomicLong;
import java.util.function.Function;

final class CouponRuntimeSupport {

    private CouponRuntimeSupport() {
    }

    static Coupon requireCoupon(
            String code,
            CouponRepository couponRepository,
            Map<String, CouponCacheEntry> couponCache,
            AtomicLong couponCacheHits,
            AtomicLong couponCacheMisses,
            Function<String, CouponOperationException> notFoundFactory
    ) {
        String normalizedCode = CouponValueSupport.normalizeCode(code, CouponRuntimeSupport::invalidCodeError);
        CouponCacheEntry cached = couponCache.get(normalizedCode);
        if (cached != null && !cached.isExpired()) {
            couponCacheHits.incrementAndGet();
            return cached.coupon();
        }
        if (cached != null && cached.isExpired()) {
            couponCache.remove(normalizedCode);
        }
        couponCacheMisses.incrementAndGet();
        Coupon coupon = couponRepository.findByCodeIgnoreCase(normalizedCode)
                .orElseThrow(() -> notFoundFactory.apply(normalizedCode));
        putCache(coupon, couponCache, 180);
        return coupon;
    }

    static void putCache(Coupon coupon, Map<String, CouponCacheEntry> couponCache, long cacheTtlSeconds) {
        if (coupon == null || coupon.getCode() == null || coupon.getCode().isBlank()) {
            return;
        }
        couponCache.put(
                coupon.getCode().trim().toUpperCase(Locale.ROOT),
                new CouponCacheEntry(coupon, LocalDateTime.now().plusSeconds(cacheTtlSeconds))
        );
    }

    static void evictCache(String code, Map<String, CouponCacheEntry> couponCache) {
        if (code == null || code.isBlank()) {
            return;
        }
        couponCache.remove(code.trim().toUpperCase(Locale.ROOT));
    }

    static void evictExpiredEntries(Map<String, CouponCacheEntry> couponCache) {
        couponCache.entrySet().removeIf(entry -> entry.getValue() == null || entry.getValue().isExpired());
    }

    static void logEvent(
            Long couponId,
            String couponCode,
            Long userId,
            CouponEventType eventType,
            String reasonCode,
            String note,
            CouponEventLogRepository couponEventLogRepository
    ) {
        try {
            CouponEventLog eventLog = new CouponEventLog();
            eventLog.setCouponId(couponId);
            eventLog.setCouponCode(couponCode);
            eventLog.setUserId(userId);
            eventLog.setEventType(eventType);
            eventLog.setReasonCode(reasonCode);
            eventLog.setNote(note);
            couponEventLogRepository.save(eventLog);
        } catch (Exception ignored) {
            // Coupon actions should not fail if analytics logging fails.
        }
    }

    private static CouponOperationException invalidCodeError(String reasonCode, String message) {
        throw new IllegalArgumentException(message);
    }

    record CouponCacheEntry(Coupon coupon, LocalDateTime expiresAt) {
        boolean isExpired() {
            return expiresAt == null || LocalDateTime.now().isAfter(expiresAt);
        }
    }
}
