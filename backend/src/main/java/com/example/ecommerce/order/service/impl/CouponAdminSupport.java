package com.example.ecommerce.order.service.impl;

import com.example.ecommerce.common.domain.CouponDiscountType;
import com.example.ecommerce.common.domain.CouponScopeType;
import com.example.ecommerce.common.domain.CouponUserEligibilityType;
import com.example.ecommerce.modal.Coupon;
import com.example.ecommerce.order.exception.CouponOperationException;
import com.example.ecommerce.order.response.CouponResponse;
import com.example.ecommerce.repository.CouponRepository;
import com.example.ecommerce.repository.CouponUserMapRepository;
import lombok.extern.slf4j.Slf4j;

import java.time.LocalDate;
import java.util.function.BiFunction;
import java.util.function.Supplier;

@Slf4j
final class CouponAdminSupport {

    private CouponAdminSupport() {
    }

    static void validateCreateOrUpdateRequest(
            String normalizedCode,
            CouponDiscountType discountType,
            Double discountValue,
            Double minimumOrderValue,
            LocalDate startDate,
            LocalDate endDate,
            Integer usageLimit,
            Integer perUserLimit,
            CouponScopeType scopeType,
            Long scopeId,
            CouponUserEligibilityType userEligibilityType,
            Integer inactiveDaysThreshold,
            Boolean firstOrderOnly,
            Long existingCouponId,
            CouponRepository couponRepository,
            BiFunction<String, String, CouponOperationException> validationErrorFactory,
            Supplier<CouponOperationException> duplicateFactory
    ) {
        if (discountType == null) {
            throw validationErrorFactory.apply("DISCOUNT_TYPE_REQUIRED", "Discount type is required");
        }
        if (discountValue == null || discountValue <= 0) {
            throw validationErrorFactory.apply("DISCOUNT_VALUE_INVALID", "Discount value must be greater than 0");
        }
        if (minimumOrderValue == null || minimumOrderValue < 0) {
            throw validationErrorFactory.apply("MIN_ORDER_INVALID", "Minimum order value cannot be negative");
        }
        if (startDate == null || endDate == null) {
            throw validationErrorFactory.apply("COUPON_DATE_REQUIRED", "Start and end date are required");
        }
        if (endDate.isBefore(startDate)) {
            throw validationErrorFactory.apply("COUPON_DATE_INVALID", "End date cannot be before start date");
        }
        if (discountType == CouponDiscountType.PERCENT && discountValue > 100) {
            throw validationErrorFactory.apply("DISCOUNT_PERCENT_INVALID", "Percent discount cannot exceed 100");
        }
        if (usageLimit != null && usageLimit < 1) {
            throw validationErrorFactory.apply("USAGE_LIMIT_INVALID", "Usage limit must be at least 1");
        }
        if (perUserLimit != null && perUserLimit < 1) {
            throw validationErrorFactory.apply("PER_USER_LIMIT_INVALID", "Per user limit must be at least 1");
        }
        if (usageLimit != null && perUserLimit != null && perUserLimit > usageLimit) {
            throw validationErrorFactory.apply("PER_USER_LIMIT_INVALID", "Per user limit cannot exceed usage limit");
        }
        CouponScopeType effectiveScopeType = scopeType == null ? CouponScopeType.GLOBAL : scopeType;
        if (effectiveScopeType != CouponScopeType.GLOBAL && scopeId == null) {
            throw validationErrorFactory.apply("SCOPE_ID_REQUIRED", "Scope id is required for selected scope type");
        }
        CouponUserEligibilityType effectiveEligibilityType = userEligibilityType == null
                ? CouponUserEligibilityType.ALL_USERS
                : userEligibilityType;
        if (Boolean.TRUE.equals(firstOrderOnly)
                && effectiveEligibilityType != CouponUserEligibilityType.ALL_USERS
                && effectiveEligibilityType != CouponUserEligibilityType.NEW_USERS_ONLY) {
            throw validationErrorFactory.apply(
                    "ELIGIBILITY_CONFLICT",
                    "firstOrderOnly can only be used with ALL_USERS or NEW_USERS_ONLY eligibility"
            );
        }
        if (effectiveEligibilityType == CouponUserEligibilityType.INACTIVE_USERS_ONLY
                && (inactiveDaysThreshold == null || inactiveDaysThreshold < 1)) {
            throw validationErrorFactory.apply(
                    "INACTIVE_DAYS_REQUIRED",
                    "Inactive days threshold is required for INACTIVE_USERS_ONLY eligibility"
            );
        }
        if (effectiveEligibilityType != CouponUserEligibilityType.INACTIVE_USERS_ONLY
                && inactiveDaysThreshold != null
                && inactiveDaysThreshold < 1) {
            throw validationErrorFactory.apply("INACTIVE_DAYS_INVALID", "Inactive days threshold must be at least 1");
        }
        if (existingCouponId == null) {
            return;
        }
        couponRepository.findByCodeIgnoreCase(normalizedCode).ifPresent(existing -> {
            if (!existingCouponId.equals(existing.getId())) {
                throw duplicateFactory.get();
            }
        });
    }

    static void applyRequestToCoupon(
            Coupon coupon,
            String normalizedCode,
            CouponDiscountType discountType,
            Double discountValue,
            Double discountPercentage,
            Double maxDiscount,
            Double minimumOrderValue,
            LocalDate startDate,
            LocalDate endDate,
            Integer usageLimit,
            Integer perUserLimit,
            CouponScopeType scopeType,
            Long scopeId,
            CouponUserEligibilityType userEligibilityType,
            Integer inactiveDaysThreshold,
            Boolean firstOrderOnly,
            Boolean active
    ) {
        coupon.setCode(normalizedCode);
        coupon.setDiscountType(discountType);
        coupon.setDiscountValue(CouponValueSupport.roundCurrency(discountValue));
        coupon.setDiscountPercentage(
                discountType == CouponDiscountType.PERCENT
                        ? CouponValueSupport.roundCurrency(discountValue)
                        : CouponValueSupport.roundCurrency(discountPercentage == null ? 0.0 : discountPercentage)
        );
        coupon.setMaxDiscount(maxDiscount == null ? null : CouponValueSupport.roundCurrency(maxDiscount));
        coupon.setMinimumOrderValue(CouponValueSupport.roundCurrency(minimumOrderValue));
        coupon.setValidityStartDate(startDate);
        coupon.setValidityEndDate(endDate);
        coupon.setUsageLimit(usageLimit);
        coupon.setPerUserLimit(perUserLimit == null ? 1 : perUserLimit);
        coupon.setScopeType(scopeType == null ? CouponScopeType.GLOBAL : scopeType);
        coupon.setScopeId(scopeType == null || scopeType == CouponScopeType.GLOBAL ? null : scopeId);
        coupon.setFirstOrderOnly(firstOrderOnly != null && firstOrderOnly);
        CouponUserEligibilityType effectiveEligibilityType = userEligibilityType == null
                ? CouponUserEligibilityType.ALL_USERS
                : userEligibilityType;
        if (coupon.isFirstOrderOnly() && effectiveEligibilityType == CouponUserEligibilityType.ALL_USERS) {
            effectiveEligibilityType = CouponUserEligibilityType.NEW_USERS_ONLY;
        }
        coupon.setUserEligibilityType(effectiveEligibilityType);
        coupon.setInactiveDaysThreshold(
                effectiveEligibilityType == CouponUserEligibilityType.INACTIVE_USERS_ONLY
                        ? (inactiveDaysThreshold == null || inactiveDaysThreshold < 1 ? 30 : inactiveDaysThreshold)
                        : null
        );
        if (active != null) {
            coupon.setActive(active);
        }
    }

    static CouponResponse toResponse(Coupon coupon, CouponUserMapRepository couponUserMapRepository) {
        CouponResponse response = new CouponResponse();
        response.setId(coupon.getId());
        response.setCode(coupon.getCode());
        response.setDiscountType(coupon.getDiscountType());
        response.setDiscountValue(coupon.getDiscountValue());
        response.setDiscountPercentage(coupon.getDiscountPercentage());
        response.setMaxDiscount(coupon.getMaxDiscount());
        response.setMinimumOrderValue(coupon.getMinimumOrderValue());
        response.setValidityStartDate(coupon.getValidityStartDate());
        response.setValidityEndDate(coupon.getValidityEndDate());
        response.setUsageLimit(coupon.getUsageLimit());
        response.setPerUserLimit(coupon.getPerUserLimit());
        response.setUsedCount(coupon.getUsedCount());
        response.setReservedCount(coupon.getReservedCount());
        response.setScopeType(coupon.getScopeType());
        response.setScopeId(coupon.getScopeId());
        response.setFirstOrderOnly(coupon.isFirstOrderOnly());
        response.setUserEligibilityType(coupon.getUserEligibilityType());
        response.setInactiveDaysThreshold(coupon.getInactiveDaysThreshold());
        response.setMappedUserCount(resolveMappedUserCount(coupon.getId(), couponUserMapRepository));
        response.setActive(coupon.isActive());
        return response;
    }

    private static long resolveMappedUserCount(Long couponId, CouponUserMapRepository couponUserMapRepository) {
        if (couponId == null) {
            return 0;
        }
        try {
            return couponUserMapRepository.countByCouponId(couponId);
        } catch (Exception ex) {
            log.warn("Unable to resolve mapped user count for coupon {}", couponId, ex);
            return 0;
        }
    }
}
