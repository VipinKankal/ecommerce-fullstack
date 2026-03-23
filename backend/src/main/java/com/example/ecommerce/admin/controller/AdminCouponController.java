package com.example.ecommerce.admin.controller;

import com.example.ecommerce.admin.request.CreateCouponRequest;
import com.example.ecommerce.modal.Cart;
import com.example.ecommerce.modal.User;
import com.example.ecommerce.order.request.CouponApplyRequest;
import com.example.ecommerce.order.request.CouponUserMappingRequest;
import com.example.ecommerce.order.request.UpdateCouponRequest;
import com.example.ecommerce.order.response.CouponResponse;
import com.example.ecommerce.order.service.CouponService;
import com.example.ecommerce.user.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/coupons")
public class AdminCouponController {
    private final CouponService couponService;
    private final UserService userService;

    @PostMapping("/apply")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Cart> applyCoupon(
            @Valid @RequestBody CouponApplyRequest request,
            @RequestHeader(value = "Authorization", required = false) String jwt,
            @RequestHeader(value = "X-Device-Id", required = false) String deviceId,
            HttpServletRequest servletRequest
    ) throws Exception {
        User user = userService.findUserByJwtToken(jwt);
        String clientIp = resolveClientIp(servletRequest);
        Cart cart;
        if (request.isApply()) {
            cart = couponService.applyCoupon(request.getCode(), user, clientIp, deviceId);
        } else {
            cart = couponService.removeCoupon(request.getCode(), user, clientIp, deviceId);
        }
        return ResponseEntity.ok(cart);
    }

    @GetMapping("/recommendation")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> recommendation(
            @RequestHeader(value = "Authorization", required = false) String jwt
    ) throws Exception {
        User user = userService.findUserByJwtToken(jwt);
        return ResponseEntity.ok(couponService.recommendCoupon(user));
    }

    @PostMapping("/admin/create")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CouponResponse> createCoupon(@Valid @RequestBody CreateCouponRequest request) {
        CouponResponse createdCoupon = couponService.createCoupon(request);
        return ResponseEntity.ok(createdCoupon);
    }

    @PutMapping("/admin/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CouponResponse> updateCoupon(
            @PathVariable Long id,
            @Valid @RequestBody UpdateCouponRequest request
    ) {
        return ResponseEntity.ok(couponService.updateCoupon(id, request));
    }

    @PostMapping("/admin/{id}/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> mapCouponUsers(
            @PathVariable Long id,
            @Valid @RequestBody CouponUserMappingRequest request
    ) {
        couponService.mapCouponUsers(id, request.getUserIds());
        return ResponseEntity.ok("Coupon user mapping updated");
    }

    @PatchMapping("/admin/{id}/disable")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> disableCoupon(@PathVariable Long id) {
        couponService.deleteCoupon(id);
        return ResponseEntity.ok("Coupon disabled successfully");
    }

    @DeleteMapping("/admin/create/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteCoupon(@PathVariable Long id) {
        couponService.deleteCoupon(id);
        return ResponseEntity.ok("Coupon disabled successfully");
    }

    @GetMapping("/admin/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<CouponResponse>> getAllCoupons() {
        List<CouponResponse> coupons = couponService.findAllCoupons();
        return ResponseEntity.ok(coupons);
    }

    @GetMapping("/admin/metrics")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> couponMetrics(
            @RequestParam(defaultValue = "30") int days
    ) {
        return ResponseEntity.ok(couponService.couponMetrics(days));
    }

    @GetMapping("/admin/monitoring")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> couponMonitoring(
            @RequestParam(defaultValue = "30") int windowMinutes
    ) {
        return ResponseEntity.ok(couponService.couponMonitoringSnapshot(windowMinutes));
    }

    private String resolveClientIp(HttpServletRequest request) {
        if (request == null) {
            return null;
        }
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
