package com.example.ecommerce.order.service.impl;

import com.example.ecommerce.common.domain.CouponEventType;
import com.example.ecommerce.common.domain.CouponScopeType;
import com.example.ecommerce.modal.Cart;
import com.example.ecommerce.modal.Coupon;
import com.example.ecommerce.modal.User;
import com.example.ecommerce.order.exception.CouponOperationException;
import com.example.ecommerce.repository.CouponRepository;
import com.example.ecommerce.repository.CouponUsageRepository;
import com.example.ecommerce.repository.OrderRepository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.atomic.AtomicLong;
import java.util.function.BiConsumer;
import java.util.function.BiFunction;

final class CouponAnalyticsSupport {

    private CouponAnalyticsSupport() {
    }

    static Map<String, Object> recommendCoupon(
            User user,
            Cart cart,
            CouponRepository couponRepository,
            OrderRepository orderRepository,
            CouponUsageRepository couponUsageRepository,
            com.example.ecommerce.repository.CouponUserMapRepository couponUserMapRepository,
            BiFunction<String, String, CouponOperationException> validationErrorFactory,
            BiConsumer<CouponEventType, Map<String, Object>> eventLogger
    ) {
        double subtotal = CouponEligibilitySupport.calculateCartSubtotal(cart);
        LocalDate today = LocalDate.now();
        long orderCount = orderRepository.countByUserId(user.getId());
        String experimentGroup = user.getId() != null && user.getId() % 2 == 0 ? "A" : "B";

        Coupon winner = null;
        double winnerDiscount = 0;
        String winnerReason = null;

        java.util.List<Coupon> candidates = couponRepository.findAll().stream()
                .filter(Objects::nonNull)
                .filter(Coupon::isActive)
                .filter(coupon -> coupon.getValidityStartDate() == null || !today.isBefore(coupon.getValidityStartDate()))
                .filter(coupon -> coupon.getValidityEndDate() == null || !today.isAfter(coupon.getValidityEndDate()))
                .toList();

        for (Coupon coupon : candidates) {
            try {
                CouponEligibilitySupport.validateCouponEligibility(
                        coupon,
                        user,
                        cart,
                        orderRepository,
                        couponUsageRepository,
                        couponUserMapRepository,
                        validationErrorFactory
                );
            } catch (CouponOperationException ignored) {
                continue;
            }

            double applicableSubtotal = CouponEligibilitySupport.calculateApplicableSubtotal(coupon, cart);
            if (applicableSubtotal <= 0) {
                continue;
            }
            double discount = CouponEligibilitySupport.estimateDiscount(coupon, applicableSubtotal);
            String reason;
            if (Boolean.TRUE.equals(coupon.isFirstOrderOnly()) && orderCount == 0) {
                reason = "new-user";
            } else if (subtotal >= 2000) {
                reason = "high-cart-value";
            } else if (orderCount >= 5) {
                reason = "loyal-customer";
            } else {
                reason = "best-discount";
            }

            boolean winsByGroupTieBreak = winner != null
                    && Double.compare(discount, winnerDiscount) == 0
                    && "B".equals(experimentGroup)
                    && coupon.getCode().compareToIgnoreCase(winner.getCode()) > 0;

            if (winner == null || discount > winnerDiscount || winsByGroupTieBreak) {
                winner = coupon;
                winnerDiscount = discount;
                winnerReason = reason;
            }
        }

        LinkedHashMap<String, Object> response = new LinkedHashMap<>();
        response.put("experimentGroup", experimentGroup);
        response.put("cartSubtotal", CouponValueSupport.roundCurrency(subtotal));
        response.put("eligibleCouponCount", candidates.size());

        if (winner == null) {
            response.put("recommended", false);
            response.put("message", "No eligible coupon found for current cart.");
            return response;
        }

        response.put("recommended", true);
        response.put("couponCode", winner.getCode());
        response.put("estimatedDiscount", CouponValueSupport.roundCurrency(winnerDiscount));
        response.put("reason", winnerReason);
        response.put("scopeType", winner.getScopeType() == null ? CouponScopeType.GLOBAL.name() : winner.getScopeType().name());
        response.put("minimumOrderValue", winner.getMinimumOrderValue());
        eventLogger.accept(CouponEventType.RECOMMENDED, Map.of(
                "couponId", winner.getId(),
                "couponCode", winner.getCode(),
                "userId", user.getId(),
                "reasonCode", "AB_GROUP_" + experimentGroup,
                "note", "Coupon recommendation served"
        ));
        return response;
    }

    static Map<String, Object> couponMetrics(
            int days,
            com.example.ecommerce.repository.CouponEventLogRepository couponEventLogRepository,
            CouponUsageRepository couponUsageRepository
    ) {
        int effectiveDays = days <= 0 ? 30 : Math.min(days, 365);
        LocalDateTime from = LocalDateTime.now().minusDays(effectiveDays);

        long applyCount = couponEventLogRepository.countByEventTypeAndCreatedAtAfter(CouponEventType.APPLIED, from);
        long rejectCount = couponEventLogRepository.countByEventTypeAndCreatedAtAfter(CouponEventType.APPLY_REJECTED, from);
        long consumedCount = couponEventLogRepository.countByEventTypeAndCreatedAtAfter(CouponEventType.CONSUMED, from);
        long restoredCount = couponEventLogRepository.countByEventTypeAndCreatedAtAfter(CouponEventType.RESTORED, from);
        long usageCount = couponUsageRepository.countByUsedAtAfter(from);
        Double summedDiscount = couponUsageRepository.sumDiscountAmountByUsedAtAfter(from);
        double totalDiscountGiven = CouponValueSupport.roundCurrency(summedDiscount == null ? 0 : summedDiscount);

        double conversion = applyCount == 0 ? 0 : (consumedCount * 100.0) / applyCount;
        double rejectionRate = applyCount == 0 ? 0 : (rejectCount * 100.0) / applyCount;

        LinkedHashMap<String, Object> response = new LinkedHashMap<>();
        response.put("days", effectiveDays);
        response.put("applied", applyCount);
        response.put("rejected", rejectCount);
        response.put("consumed", consumedCount);
        response.put("restored", restoredCount);
        response.put("usageRows", usageCount);
        response.put("totalDiscountGiven", totalDiscountGiven);
        response.put("conversionRatePercent", CouponValueSupport.roundCurrency(conversion));
        response.put("rejectionRatePercent", CouponValueSupport.roundCurrency(rejectionRate));
        return response;
    }

    static Map<String, Object> couponMonitoringSnapshot(
            int windowMinutes,
            com.example.ecommerce.repository.CouponEventLogRepository couponEventLogRepository,
            AtomicLong couponCacheHits,
            AtomicLong couponCacheMisses,
            int cacheSize,
            long cacheTtlSeconds
    ) {
        int effectiveWindow = windowMinutes <= 0 ? 30 : Math.min(windowMinutes, 180);
        LocalDateTime from = LocalDateTime.now().minusMinutes(effectiveWindow);
        long applies = couponEventLogRepository.countByEventTypeAndCreatedAtAfter(CouponEventType.APPLIED, from);
        long rejects = couponEventLogRepository.countByEventTypeAndCreatedAtAfter(CouponEventType.APPLY_REJECTED, from);
        long recommended = couponEventLogRepository.countByEventTypeAndCreatedAtAfter(CouponEventType.RECOMMENDED, from);
        double rejectRate = applies == 0 ? 0 : (rejects * 100.0) / applies;
        long cacheHits = couponCacheHits.get();
        long cacheMisses = couponCacheMisses.get();
        long cacheAccesses = cacheHits + cacheMisses;
        double cacheHitRate = cacheAccesses == 0 ? 0 : (cacheHits * 100.0) / cacheAccesses;

        LinkedHashMap<String, Object> response = new LinkedHashMap<>();
        response.put("windowMinutes", effectiveWindow);
        response.put("applies", applies);
        response.put("rejects", rejects);
        response.put("recommended", recommended);
        response.put("rejectRatePercent", CouponValueSupport.roundCurrency(rejectRate));
        response.put("cacheHits", cacheHits);
        response.put("cacheMisses", cacheMisses);
        response.put("cacheHitRatePercent", CouponValueSupport.roundCurrency(cacheHitRate));
        response.put("cacheSize", cacheSize);
        response.put("cacheTtlSeconds", cacheTtlSeconds);
        response.put("alert", applies >= 20 && rejectRate >= 40.0);
        return response;
    }
}
