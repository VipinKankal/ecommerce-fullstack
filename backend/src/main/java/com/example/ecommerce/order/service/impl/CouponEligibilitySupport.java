package com.example.ecommerce.order.service.impl;

import com.example.ecommerce.common.domain.AccountStatus;
import com.example.ecommerce.common.domain.CouponDiscountType;
import com.example.ecommerce.common.domain.CouponScopeType;
import com.example.ecommerce.common.domain.CouponUserEligibilityType;
import com.example.ecommerce.modal.Cart;
import com.example.ecommerce.modal.CartItem;
import com.example.ecommerce.modal.Coupon;
import com.example.ecommerce.modal.Order;
import com.example.ecommerce.modal.User;
import com.example.ecommerce.order.exception.CouponOperationException;
import com.example.ecommerce.repository.CouponUsageRepository;
import com.example.ecommerce.repository.CouponUserMapRepository;
import com.example.ecommerce.repository.OrderRepository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.function.BiFunction;

final class CouponEligibilitySupport {

    private CouponEligibilitySupport() {
    }

    static void validateCouponEligibility(
            Coupon coupon,
            User user,
            Cart cart,
            OrderRepository orderRepository,
            CouponUsageRepository couponUsageRepository,
            CouponUserMapRepository couponUserMapRepository,
            BiFunction<String, String, CouponOperationException> validationErrorFactory
    ) {
        double subtotal = calculateCartSubtotal(cart);
        if (!coupon.isActive()) {
            throw validationErrorFactory.apply("COUPON_INACTIVE", "Coupon is not active");
        }
        if (user.getAccountStatus() != AccountStatus.ACTIVE) {
            throw validationErrorFactory.apply("USER_INACTIVE", "Only active users can use coupons");
        }
        if (subtotal <= 0) {
            throw validationErrorFactory.apply("CART_EMPTY", "Cart is empty");
        }
        if (subtotal < coupon.getMinimumOrderValue()) {
            throw validationErrorFactory.apply(
                    "MIN_ORDER_NOT_MET",
                    "Valid for minimum order value " + CouponValueSupport.roundCurrency(coupon.getMinimumOrderValue())
            );
        }

        LocalDate today = LocalDate.now();
        boolean afterStart = coupon.getValidityStartDate() == null || !today.isBefore(coupon.getValidityStartDate());
        boolean beforeEnd = coupon.getValidityEndDate() == null || !today.isAfter(coupon.getValidityEndDate());
        if (!afterStart || !beforeEnd) {
            throw validationErrorFactory.apply("COUPON_EXPIRED", "Coupon not valid");
        }

        int usedCount = coupon.getUsedCount() == null ? 0 : coupon.getUsedCount();
        int reservedCount = coupon.getReservedCount() == null ? 0 : coupon.getReservedCount();
        if (coupon.getUsageLimit() != null && usedCount + reservedCount >= coupon.getUsageLimit()) {
            throw validationErrorFactory.apply("USAGE_LIMIT_REACHED", "Coupon usage limit reached");
        }

        long userOrderCount = orderRepository.countByUserId(user.getId());
        long usedByUser = couponUsageRepository.countByCouponIdAndUserId(coupon.getId(), user.getId());
        int perUserLimit = coupon.getPerUserLimit() == null ? 1 : coupon.getPerUserLimit();
        if (usedByUser >= perUserLimit) {
            throw validationErrorFactory.apply("PER_USER_LIMIT_REACHED", "Per user coupon limit reached");
        }

        if (Boolean.TRUE.equals(coupon.isFirstOrderOnly()) && userOrderCount > 0) {
            throw validationErrorFactory.apply("FIRST_ORDER_ONLY", "This coupon is valid for first order only");
        }

        validateAdvancedUserEligibility(coupon, user, userOrderCount, orderRepository, validationErrorFactory);

        if (couponUserMapRepository.countByCouponId(coupon.getId()) > 0
                && !couponUserMapRepository.existsByCouponIdAndUserId(coupon.getId(), user.getId())) {
            throw validationErrorFactory.apply("USER_NOT_ELIGIBLE", "You are not eligible for this coupon");
        }

        double applicableSubtotal = calculateApplicableSubtotal(coupon, cart);
        if (applicableSubtotal <= 0) {
            throw validationErrorFactory.apply("NOT_APPLICABLE_TO_CART", "Coupon is not applicable to current cart items");
        }
    }

    static double calculateCartSubtotal(Cart cart) {
        if (cart.getCartItems() == null) {
            return 0;
        }
        return cart.getCartItems().stream()
                .map(CartItem::getSellingPrice)
                .filter(value -> value != null)
                .mapToDouble(Integer::doubleValue)
                .sum();
    }

    static double calculateApplicableSubtotal(Coupon coupon, Cart cart) {
        if (cart.getCartItems() == null) {
            return 0;
        }
        return cart.getCartItems().stream()
                .filter(item -> isItemApplicable(coupon, item))
                .map(CartItem::getSellingPrice)
                .filter(value -> value != null)
                .mapToDouble(Integer::doubleValue)
                .sum();
    }

    static double estimateDiscount(Coupon coupon, double applicableSubtotal) {
        CouponDiscountType discountType = coupon.getDiscountType() == null
                ? CouponDiscountType.PERCENT
                : coupon.getDiscountType();
        double discount;
        if (discountType == CouponDiscountType.FLAT) {
            discount = coupon.getDiscountValue();
        } else {
            double percent = coupon.getDiscountValue() > 0
                    ? coupon.getDiscountValue()
                    : coupon.getDiscountPercentage();
            discount = (applicableSubtotal * percent) / 100.0;
        }
        if (coupon.getMaxDiscount() != null && coupon.getMaxDiscount() > 0) {
            discount = Math.min(discount, coupon.getMaxDiscount());
        }
        return CouponValueSupport.roundCurrency(Math.min(discount, applicableSubtotal));
    }

    private static void validateAdvancedUserEligibility(
            Coupon coupon,
            User user,
            long userOrderCount,
            OrderRepository orderRepository,
            BiFunction<String, String, CouponOperationException> validationErrorFactory
    ) {
        CouponUserEligibilityType eligibilityType = coupon.getUserEligibilityType() == null
                ? CouponUserEligibilityType.ALL_USERS
                : coupon.getUserEligibilityType();

        if (eligibilityType == CouponUserEligibilityType.ALL_USERS) {
            return;
        }
        if (eligibilityType == CouponUserEligibilityType.NEW_USERS_ONLY && userOrderCount > 0) {
            throw validationErrorFactory.apply("NEW_USERS_ONLY", "This coupon is only valid for new users");
        }
        if (eligibilityType == CouponUserEligibilityType.RETURNING_USERS_ONLY && userOrderCount == 0) {
            throw validationErrorFactory.apply("RETURNING_USERS_ONLY", "This coupon is only valid for returning users");
        }
        if (eligibilityType == CouponUserEligibilityType.INACTIVE_USERS_ONLY) {
            if (userOrderCount == 0) {
                throw validationErrorFactory.apply("INACTIVE_USERS_ONLY", "This coupon is for inactive users with prior orders");
            }
            int inactiveDays = coupon.getInactiveDaysThreshold() == null || coupon.getInactiveDaysThreshold() < 1
                    ? 30
                    : coupon.getInactiveDaysThreshold();
            Order latestOrder = orderRepository.findTopByUserIdOrderByOrderDateDesc(user.getId()).orElse(null);
            LocalDateTime latestOrderDate = latestOrder == null ? null : latestOrder.getOrderDate();
            if (latestOrderDate == null || latestOrderDate.isAfter(LocalDateTime.now().minusDays(inactiveDays))) {
                throw validationErrorFactory.apply(
                        "INACTIVE_DAYS_NOT_MET",
                        "This coupon is valid for users inactive for at least " + inactiveDays + " days"
                );
            }
        }
    }

    private static boolean isItemApplicable(Coupon coupon, CartItem item) {
        if (coupon == null || item == null || item.getProduct() == null) {
            return false;
        }
        CouponScopeType scopeType = coupon.getScopeType() == null ? CouponScopeType.GLOBAL : coupon.getScopeType();
        Long scopeId = coupon.getScopeId();
        if (scopeType == CouponScopeType.GLOBAL || scopeId == null) {
            return true;
        }
        return switch (scopeType) {
            case SELLER -> item.getProduct().getSeller() != null && scopeId.equals(item.getProduct().getSeller().getId());
            case CATEGORY -> item.getProduct().getCategory() != null && scopeId.equals(item.getProduct().getCategory().getId());
            case PRODUCT -> item.getProduct().getId() != null && scopeId.equals(item.getProduct().getId());
            case GLOBAL -> true;
        };
    }
}
