package com.example.ecommerce.order.service.impl;

import com.example.ecommerce.common.domain.AccountStatus;
import com.example.ecommerce.common.domain.CouponEventType;
import com.example.ecommerce.common.domain.CouponUserEligibilityType;
import com.example.ecommerce.modal.Cart;
import com.example.ecommerce.modal.CartItem;
import com.example.ecommerce.modal.Coupon;
import com.example.ecommerce.modal.CouponUsage;
import com.example.ecommerce.modal.Order;
import com.example.ecommerce.modal.Product;
import com.example.ecommerce.modal.User;
import com.example.ecommerce.order.exception.CouponOperationException;
import com.example.ecommerce.repository.CartRepository;
import com.example.ecommerce.repository.CouponEventLogRepository;
import com.example.ecommerce.repository.CouponRepository;
import com.example.ecommerce.repository.CouponUsageRepository;
import com.example.ecommerce.repository.CouponUserMapRepository;
import com.example.ecommerce.repository.OrderRepository;
import com.example.ecommerce.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CouponServiceImplTest {

    @Mock
    private CouponRepository couponRepository;
    @Mock
    private CartRepository cartRepository;
    @Mock
    private CouponUsageRepository couponUsageRepository;
    @Mock
    private CouponUserMapRepository couponUserMapRepository;
    @Mock
    private CouponEventLogRepository couponEventLogRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private OrderRepository orderRepository;
    @Mock
    private com.example.ecommerce.order.service.CartService cartService;

    @InjectMocks
    private CouponServiceImpl couponService;

    private User user;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(10L);
        user.setAccountStatus(AccountStatus.ACTIVE);
    }

    @Test
    void applyCouponBlocksWhenThrottleLimitExceeded() {
        Cart cart = new Cart();
        cart.setUser(user);
        when(cartRepository.findByUserId(10L)).thenReturn(cart);
        when(couponEventLogRepository.countByUserIdAndCreatedAtAfter(eq(10L), any(LocalDateTime.class)))
                .thenReturn(20L);

        CouponOperationException ex = assertThrows(
                CouponOperationException.class,
                () -> couponService.applyCoupon("SAVE10", user, "127.0.0.1", "device-1")
        );

        assertEquals("COUPON_RATE_LIMIT", ex.getReasonCode());
    }

    @Test
    void restoreCouponUsageForCancelledOrdersRestoresUsageAndCount() {
        Coupon coupon = new Coupon();
        coupon.setId(1L);
        coupon.setCode("SAVE10");
        coupon.setUsedCount(2);

        Order order = new Order();
        order.setId(99L);
        order.setCouponCode("SAVE10");
        order.setUser(user);

        CouponUsage usage = new CouponUsage();
        usage.setId(500L);
        usage.setCoupon(coupon);
        usage.setOrderId(99L);

        when(couponRepository.findByCodeIgnoreCase("SAVE10")).thenReturn(Optional.of(coupon));
        when(couponUsageRepository.findByCouponIdAndOrderId(1L, 99L)).thenReturn(Optional.of(usage));

        couponService.restoreCouponUsageForCancelledOrders(user, List.of(order), "cancelled-before-shipment");

        verify(couponUsageRepository).delete(usage);
        assertEquals(1, coupon.getUsedCount());
        verify(couponRepository).save(coupon);
    }

    @Test
    void couponMetricsReturnsConsistentPercentages() {
        when(couponEventLogRepository.countByEventTypeAndCreatedAtAfter(eq(CouponEventType.APPLIED), any(LocalDateTime.class)))
                .thenReturn(100L);
        when(couponEventLogRepository.countByEventTypeAndCreatedAtAfter(eq(CouponEventType.APPLY_REJECTED), any(LocalDateTime.class)))
                .thenReturn(20L);
        when(couponEventLogRepository.countByEventTypeAndCreatedAtAfter(eq(CouponEventType.CONSUMED), any(LocalDateTime.class)))
                .thenReturn(40L);
        when(couponEventLogRepository.countByEventTypeAndCreatedAtAfter(eq(CouponEventType.RESTORED), any(LocalDateTime.class)))
                .thenReturn(5L);
        when(couponUsageRepository.countByUsedAtAfter(any(LocalDateTime.class))).thenReturn(40L);
        when(couponUsageRepository.sumDiscountAmountByUsedAtAfter(any(LocalDateTime.class))).thenReturn(1234.56);

        Map<String, Object> metrics = couponService.couponMetrics(30);

        assertEquals(100L, metrics.get("applied"));
        assertEquals(40L, metrics.get("consumed"));
        assertEquals(40.0, metrics.get("conversionRatePercent"));
        assertEquals(20.0, metrics.get("rejectionRatePercent"));
        assertEquals(1234.56, metrics.get("totalDiscountGiven"));
    }

    @Test
    void applyCouponRejectsNewUserForReturningUsersOnlyCoupon() {
        Cart cart = new Cart();
        cart.setUser(user);

        Product product = new Product();
        product.setId(101L);
        CartItem cartItem = new CartItem();
        cartItem.setProduct(product);
        cartItem.setSellingPrice(800);
        cart.setCartItems(new HashSet<>(List.of(cartItem)));

        Coupon coupon = new Coupon();
        coupon.setId(1L);
        coupon.setCode("SAVE10");
        coupon.setMinimumOrderValue(0);
        coupon.setValidityStartDate(LocalDate.now().minusDays(1));
        coupon.setValidityEndDate(LocalDate.now().plusDays(2));
        coupon.setPerUserLimit(1);
        coupon.setUserEligibilityType(CouponUserEligibilityType.RETURNING_USERS_ONLY);

        when(cartRepository.findByUserId(10L)).thenReturn(cart);
        when(couponEventLogRepository.countByUserIdAndCreatedAtAfter(eq(10L), any(LocalDateTime.class))).thenReturn(0L);
        when(couponEventLogRepository.countByUserIdAndEventTypeAndCreatedAtAfter(eq(10L), eq(CouponEventType.APPLY_REJECTED), any(LocalDateTime.class)))
                .thenReturn(0L);
        when(couponRepository.findByCodeIgnoreCase("SAVE10")).thenReturn(Optional.of(coupon));
        when(couponUsageRepository.countByCouponIdAndUserId(1L, 10L)).thenReturn(0L);
        when(orderRepository.countByUserId(10L)).thenReturn(0L);

        CouponOperationException ex = assertThrows(
                CouponOperationException.class,
                () -> couponService.applyCoupon("SAVE10", user, "127.0.0.1", "device-1")
        );

        assertEquals("RETURNING_USERS_ONLY", ex.getReasonCode());
    }

    @Test
    void applyCouponBlocksWhenIpRejectThresholdExceeded() {
        Cart cart = new Cart();
        cart.setUser(user);

        Product product = new Product();
        product.setId(101L);
        CartItem cartItem = new CartItem();
        cartItem.setProduct(product);
        cartItem.setSellingPrice(800);
        cart.setCartItems(new HashSet<>(List.of(cartItem)));

        Coupon coupon = new Coupon();
        coupon.setId(1L);
        coupon.setCode("SAVE10");
        coupon.setMinimumOrderValue(0);
        coupon.setValidityStartDate(LocalDate.now().minusDays(1));
        coupon.setValidityEndDate(LocalDate.now().plusDays(2));
        coupon.setPerUserLimit(1);

        when(cartRepository.findByUserId(10L)).thenReturn(cart);
        when(couponEventLogRepository.countByUserIdAndCreatedAtAfter(eq(10L), any(LocalDateTime.class))).thenReturn(0L);
        when(couponEventLogRepository.countByUserIdAndEventTypeAndCreatedAtAfter(eq(10L), eq(CouponEventType.APPLY_REJECTED), any(LocalDateTime.class)))
                .thenReturn(0L);
        when(couponEventLogRepository.countByEventTypeAndNoteContainingAndCreatedAtAfter(
                eq(CouponEventType.APPLY_REJECTED),
                anyString(),
                any(LocalDateTime.class)
        )).thenReturn(16L);

        CouponOperationException ex = assertThrows(
                CouponOperationException.class,
                () -> couponService.applyCoupon("SAVE10", user, "127.0.0.1", "device-1")
        );

        assertEquals("COUPON_IP_BLOCKED", ex.getReasonCode());
    }

    @Test
    void couponMonitoringSnapshotIncludesCacheStatsAndAlert() {
        when(couponEventLogRepository.countByEventTypeAndCreatedAtAfter(eq(CouponEventType.APPLIED), any(LocalDateTime.class)))
                .thenReturn(40L);
        when(couponEventLogRepository.countByEventTypeAndCreatedAtAfter(eq(CouponEventType.APPLY_REJECTED), any(LocalDateTime.class)))
                .thenReturn(20L);
        when(couponEventLogRepository.countByEventTypeAndCreatedAtAfter(eq(CouponEventType.RECOMMENDED), any(LocalDateTime.class)))
                .thenReturn(15L);

        Map<String, Object> snapshot = couponService.couponMonitoringSnapshot(30);

        assertEquals(40L, snapshot.get("applies"));
        assertEquals(20L, snapshot.get("rejects"));
        assertEquals(50.0, snapshot.get("rejectRatePercent"));
        assertTrue(Boolean.TRUE.equals(snapshot.get("alert")));
        assertTrue(snapshot.containsKey("cacheHits"));
        assertTrue(snapshot.containsKey("cacheMisses"));
        assertTrue(snapshot.containsKey("cacheHitRatePercent"));
    }

    @Test
    void releaseCouponReservationSkipsWhenNoReservedCount() {
        Coupon coupon = new Coupon();
        coupon.setId(1L);
        coupon.setCode("SAVE10");
        coupon.setReservedCount(0);

        when(couponRepository.findByCodeForUpdate("SAVE10")).thenReturn(Optional.of(coupon));

        couponService.releaseCouponReservation("SAVE10", user.getId(), "MANUAL_TEST", "noop");

        verify(couponRepository, never()).save(any(Coupon.class));
    }
}
