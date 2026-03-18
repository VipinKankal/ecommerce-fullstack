package com.example.ecommerce.order.service.impl;

import com.example.ecommerce.modal.Cart;
import com.example.ecommerce.modal.Coupon;
import com.example.ecommerce.modal.User;
import com.example.ecommerce.repository.CartRepository;
import com.example.ecommerce.repository.CouponRepository;
import com.example.ecommerce.repository.UserRepository;
import com.example.ecommerce.order.service.CouponService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CouponServiceImpl implements CouponService {

    private final CouponRepository couponRepository;
    private final CartRepository cartRepository;
    private final UserRepository userRepository;

    @Override
    public Cart applyCoupon(String code, double ignoredOrderValue, User user) throws Exception {
        Coupon coupon = couponRepository.findByCode(code);
        Cart cart = cartRepository.findByUserId(user.getId());

        if (coupon == null || !coupon.isActive()) {
            throw new Exception("Coupon is not active");
        }

        if (cart == null) {
            throw new Exception("Cart not found");
        }

        if (user.getUsedCoupons().contains(coupon)) {
            throw new Exception("Coupon already used");
        }

        double orderValue = cart.getTotalSellingPrice();
        if (orderValue < coupon.getMinimumOrderValue()) {
            throw new Exception("Valid for minimum order value " + coupon.getMinimumOrderValue());
        }

        LocalDate today = LocalDate.now();
        boolean withinValidity = !today.isBefore(coupon.getValidityStartDate())
                && !today.isAfter(coupon.getValidityEndDate());
        if (!withinValidity) {
            throw new Exception("Coupon not valid");
        }

        double discountedPrice = (cart.getTotalSellingPrice() * coupon.getDiscountPercentage()) / 100;
        cart.setTotalSellingPrice(cart.getTotalSellingPrice() - discountedPrice);
        cart.setCouponCode(code);

        user.getUsedCoupons().add(coupon);
        userRepository.save(user);

        return cartRepository.save(cart);
    }

    @Override
    public Cart removeCoupon(String code, User user) throws Exception {
        Coupon coupon = couponRepository.findByCode(code);
        if (coupon == null) {
            throw new Exception("Coupon not applied");
        }

        Cart cart = cartRepository.findByUserId(user.getId());
        if (cart == null || cart.getCouponCode() == null || !cart.getCouponCode().equals(code)) {
            throw new Exception("Coupon not applied on this cart");
        }

        double discountFactor = 1 - (coupon.getDiscountPercentage() / 100.0);
        if (discountFactor <= 0) {
            throw new Exception("Invalid coupon discount");
        }
        double restoredBaseAmount = cart.getTotalSellingPrice() / discountFactor;

        cart.setTotalSellingPrice(restoredBaseAmount);
        cart.setCouponCode(null);

        return cartRepository.save(cart);
    }

    @Override
    public Coupon findCouponById(Long id) {
        return couponRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Coupon not found"));
    }

    @Override
    @PreAuthorize("hasRole('ADMIN')")
    public Coupon createCoupon(Coupon coupon) {
        return couponRepository.save(coupon);
    }

    @Override
    public List<Coupon> findAllCoupons() {
        return couponRepository.findAll();
    }

    @Override
    @PreAuthorize("hasRole('ADMIN')")
    public void deleteCoupon(Long id) {
        findCouponById(id);
        couponRepository.deleteById(id);
    }
}






