package com.example.ecommerce.order.service;

import com.example.ecommerce.admin.request.CreateCouponRequest;
import com.example.ecommerce.modal.Cart;
import com.example.ecommerce.modal.Coupon;
import com.example.ecommerce.modal.Order;
import com.example.ecommerce.modal.User;
import com.example.ecommerce.order.request.UpdateCouponRequest;
import com.example.ecommerce.order.response.CouponResponse;

import java.util.Collection;
import java.util.List;
import java.util.Map;

public interface CouponService {
    Cart applyCoupon(String code, User user, String clientIp, String deviceId) throws Exception;
    Cart removeCoupon(String code, User user, String clientIp, String deviceId) throws Exception;
    Coupon findCouponById(Long Id);
    CouponResponse createCoupon(CreateCouponRequest request);
    CouponResponse updateCoupon(Long id, UpdateCouponRequest request);
    List<CouponResponse> findAllCoupons();
    void deleteCoupon(Long Id);
    void mapCouponUsers(Long couponId, List<Long> userIds);
    void expireOutdatedCoupons();
    void validateAppliedCoupon(User user, Cart cart);
    void markCouponUsedIfPresent(User user, Collection<Order> orders);
    String reserveCouponForCheckout(User user, Cart cart, String reservationRef);
    String reserveCouponForOrders(User user, Collection<Order> orders, String reservationRef);
    void releaseCouponReservation(String couponCode, Long userId, String reasonCode, String note);
    void restoreCouponUsageForCancelledOrders(User user, Collection<Order> orders, String note);
    Map<String, Object> recommendCoupon(User user);
    Map<String, Object> couponMetrics(int days);
    Map<String, Object> couponMonitoringSnapshot(int windowMinutes);
}




