package com.example.ecommerce.order.service;

import com.example.ecommerce.modal.Cart;
import com.example.ecommerce.modal.Coupon;
import com.example.ecommerce.modal.User;

import java.util.List;

public interface CouponService {
    Cart applyCoupon(String code, double orderValue, User user) throws Exception;
    Cart removeCoupon(String code, User user) throws Exception;
    Coupon findCouponById(Long Id);
    Coupon createCoupon(Coupon coupon);
    List<Coupon> findAllCoupons();
    void deleteCoupon(Long Id);
}




