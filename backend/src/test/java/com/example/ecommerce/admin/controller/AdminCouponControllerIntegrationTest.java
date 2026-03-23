package com.example.ecommerce.admin.controller;

import com.example.ecommerce.modal.Cart;
import com.example.ecommerce.modal.User;
import com.example.ecommerce.order.request.CouponApplyRequest;
import com.example.ecommerce.order.service.CouponService;
import com.example.ecommerce.user.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import java.util.LinkedHashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminCouponControllerIntegrationTest {

    @Mock
    private CouponService couponService;

    @Mock
    private UserService userService;

    @Mock
    private HttpServletRequest httpServletRequest;

    @InjectMocks
    private AdminCouponController adminCouponController;

    @Test
    void applyCouponPassesResolvedIpAndDeviceToService() throws Exception {
        User user = new User();
        user.setId(42L);

        CouponApplyRequest request = new CouponApplyRequest();
        request.setApply(true);
        request.setCode("SAVE10");

        Cart cart = new Cart();
        when(userService.findUserByJwtToken("Bearer sample")).thenReturn(user);
        when(httpServletRequest.getHeader("X-Forwarded-For")).thenReturn("203.0.113.11, 10.0.0.1");
        when(couponService.applyCoupon("SAVE10", user, "203.0.113.11", "device-abc")).thenReturn(cart);

        ResponseEntity<Cart> response = adminCouponController.applyCoupon(
                request,
                "Bearer sample",
                "device-abc",
                httpServletRequest
        );

        assertNotNull(response);
        assertEquals(cart, response.getBody());
        verify(couponService).applyCoupon("SAVE10", user, "203.0.113.11", "device-abc");
    }

    @Test
    void metricsAndMonitoringEndpointsDelegateToService() {
        Map<String, Object> metrics = new LinkedHashMap<>();
        metrics.put("days", 30);
        metrics.put("applied", 25L);

        Map<String, Object> monitoring = new LinkedHashMap<>();
        monitoring.put("windowMinutes", 30);
        monitoring.put("alert", true);

        when(couponService.couponMetrics(30)).thenReturn(metrics);
        when(couponService.couponMonitoringSnapshot(30)).thenReturn(monitoring);

        ResponseEntity<Map<String, Object>> metricsResponse = adminCouponController.couponMetrics(30);
        ResponseEntity<Map<String, Object>> monitoringResponse = adminCouponController.couponMonitoring(30);

        assertEquals(25L, metricsResponse.getBody().get("applied"));
        assertEquals(true, monitoringResponse.getBody().get("alert"));
        verify(couponService).couponMetrics(30);
        verify(couponService).couponMonitoringSnapshot(30);
    }

    @Test
    void recommendationEndpointUsesAuthenticatedUser() throws Exception {
        User user = new User();
        user.setId(101L);
        when(userService.findUserByJwtToken("Bearer token")).thenReturn(user);
        when(couponService.recommendCoupon(user)).thenReturn(Map.of("recommended", true));

        ResponseEntity<Map<String, Object>> response = adminCouponController.recommendation("Bearer token");

        assertEquals(true, response.getBody().get("recommended"));
        verify(couponService).recommendCoupon(eq(user));
        verify(userService).findUserByJwtToken(any());
    }
}

