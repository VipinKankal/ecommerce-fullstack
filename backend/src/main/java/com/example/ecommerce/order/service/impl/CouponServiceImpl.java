package com.example.ecommerce.order.service.impl;

import com.example.ecommerce.admin.request.CreateCouponRequest;
import com.example.ecommerce.common.domain.AccountStatus;
import com.example.ecommerce.common.domain.CouponEventType;
import com.example.ecommerce.common.domain.CouponDiscountType;
import com.example.ecommerce.common.domain.CouponScopeType;
import com.example.ecommerce.common.domain.CouponUserEligibilityType;
import com.example.ecommerce.common.response.ApiErrorCode;
import com.example.ecommerce.modal.Cart;
import com.example.ecommerce.modal.CartItem;
import com.example.ecommerce.modal.Coupon;
import com.example.ecommerce.modal.CouponEventLog;
import com.example.ecommerce.modal.CouponUsage;
import com.example.ecommerce.modal.CouponUserMap;
import com.example.ecommerce.modal.Order;
import com.example.ecommerce.modal.User;
import com.example.ecommerce.order.exception.CouponOperationException;
import com.example.ecommerce.order.request.UpdateCouponRequest;
import com.example.ecommerce.order.response.CouponResponse;
import com.example.ecommerce.order.service.CartService;
import com.example.ecommerce.order.service.CouponService;
import com.example.ecommerce.repository.CartRepository;
import com.example.ecommerce.repository.CouponEventLogRepository;
import com.example.ecommerce.repository.CouponRepository;
import com.example.ecommerce.repository.CouponUserMapRepository;
import com.example.ecommerce.repository.CouponUsageRepository;
import com.example.ecommerce.repository.OrderRepository;
import com.example.ecommerce.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

@Service
@Slf4j
@RequiredArgsConstructor
@Transactional
public class CouponServiceImpl implements CouponService {

    private static final long CACHE_TTL_SECONDS = 180;
    private static final int MAX_COUPON_ATTEMPTS_PER_2_MIN = 20;
    private static final int MAX_COUPON_REJECTS_PER_10_MIN = 8;
    private static final int MAX_IP_REJECTS_PER_10_MIN = 16;
    private static final int MAX_DEVICE_REJECTS_PER_10_MIN = 12;
    private static final int MAX_DEVICE_ATTEMPTS_PER_2_MIN = 24;

    private final CouponRepository couponRepository;
    private final CartRepository cartRepository;
    private final CouponUsageRepository couponUsageRepository;
    private final CouponUserMapRepository couponUserMapRepository;
    private final CouponEventLogRepository couponEventLogRepository;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final CartService cartService;
    private final Map<String, CouponCacheEntry> couponCache = new ConcurrentHashMap<>();
    private final AtomicLong couponCacheHits = new AtomicLong();
    private final AtomicLong couponCacheMisses = new AtomicLong();

    @Override
    public Cart applyCoupon(String code, User user, String clientIp, String deviceId) throws Exception {
        Cart cart = requireCart(user);
        String normalizedCode = normalizeCode(code);
        String requestContext = formatContext(clientIp, deviceId);
        try {
            enforceFraudThrottle(user, clientIp, deviceId);
            if (cart.getCartItems() == null || cart.getCartItems().isEmpty()) {
                throw couponValidation("CART_EMPTY", "Cart is empty");
            }

            Coupon coupon = requireCoupon(normalizedCode);
            validateCouponEligibility(coupon, user, cart);

            cart.setCouponCode(coupon.getCode());
            cartRepository.save(cart);
            Cart refreshedCart = cartService.findUserCart(user);
            logEvent(
                    coupon.getId(),
                    coupon.getCode(),
                    user.getId(),
                    CouponEventType.APPLIED,
                    null,
                    "Coupon applied on cart" + requestContext
            );
            return cartRepository.save(refreshedCart);
        } catch (CouponOperationException ex) {
            logEvent(
                    null,
                    normalizedCode,
                    user.getId(),
                    CouponEventType.APPLY_REJECTED,
                    ex.getReasonCode(),
                    ex.getMessage() + requestContext
            );
            throw ex;
        }
    }

    @Override
    public Cart removeCoupon(String code, User user, String clientIp, String deviceId) throws Exception {
        Cart cart = requireCart(user);
        String normalizedCode = normalizeCode(code);
        if (cart.getCouponCode() == null || !cart.getCouponCode().equalsIgnoreCase(normalizedCode)) {
            throw couponValidation("COUPON_NOT_APPLIED", "Coupon not applied on this cart");
        }

        Coupon coupon = couponRepository.findByCodeIgnoreCase(normalizedCode).orElse(null);
        cart.setCouponCode(null);
        cart.setCouponDiscountAmount(0.0);
        Cart refreshedCart = cartService.findUserCart(user);
        logEvent(
                coupon == null ? null : coupon.getId(),
                normalizedCode,
                user.getId(),
                CouponEventType.REMOVED,
                null,
                "Coupon removed from cart" + formatContext(clientIp, deviceId)
        );
        return cartRepository.save(refreshedCart);
    }

    @Override
    public Coupon findCouponById(Long id) {
        return couponRepository.findById(id)
                .orElseThrow(() -> couponNotFound(id.toString()));
    }

    @Override
    @PreAuthorize("hasRole('ADMIN')")
    public CouponResponse createCoupon(CreateCouponRequest request) {
        String normalizedCode = normalizeCode(request.getCode());
        validateCreateOrUpdateRequest(
                normalizedCode,
                request.getDiscountType(),
                request.getDiscountValue(),
                request.getMinimumOrderValue(),
                request.getValidityStartDate(),
                request.getValidityEndDate(),
                request.getUsageLimit(),
                request.getPerUserLimit(),
                request.getScopeType(),
                request.getScopeId(),
                request.getUserEligibilityType(),
                request.getInactiveDaysThreshold(),
                request.getFirstOrderOnly(),
                null
        );
        if (couponRepository.existsByCodeIgnoreCase(normalizedCode)) {
            throw couponDuplicate();
        }
        Coupon coupon = new Coupon();
        applyRequestToCoupon(
                coupon,
                normalizedCode,
                request.getDiscountType(),
                request.getDiscountValue(),
                request.getDiscountPercentage(),
                request.getMaxDiscount(),
                request.getMinimumOrderValue(),
                request.getValidityStartDate(),
                request.getValidityEndDate(),
                request.getUsageLimit(),
                request.getPerUserLimit(),
                request.getScopeType(),
                request.getScopeId(),
                request.getUserEligibilityType(),
                request.getInactiveDaysThreshold(),
                request.getFirstOrderOnly(),
                request.getActive()
        );
        coupon.setUsedCount(0);
        Coupon saved = couponRepository.save(coupon);
        putCache(saved);
        logEvent(saved.getId(), saved.getCode(), null, CouponEventType.CREATED, null, "Coupon created");
        return toResponse(saved);
    }

    @Override
    @PreAuthorize("hasRole('ADMIN')")
    public CouponResponse updateCoupon(Long id, UpdateCouponRequest request) {
        Coupon coupon = findCouponById(id);
        String normalizedCode = normalizeCode(request.getCode());
        validateCreateOrUpdateRequest(
                normalizedCode,
                request.getDiscountType(),
                request.getDiscountValue(),
                request.getMinimumOrderValue(),
                request.getValidityStartDate(),
                request.getValidityEndDate(),
                request.getUsageLimit(),
                request.getPerUserLimit(),
                request.getScopeType(),
                request.getScopeId(),
                request.getUserEligibilityType(),
                request.getInactiveDaysThreshold(),
                request.getFirstOrderOnly(),
                coupon.getId()
        );

        applyRequestToCoupon(
                coupon,
                normalizedCode,
                request.getDiscountType(),
                request.getDiscountValue(),
                request.getDiscountPercentage(),
                request.getMaxDiscount(),
                request.getMinimumOrderValue(),
                request.getValidityStartDate(),
                request.getValidityEndDate(),
                request.getUsageLimit(),
                request.getPerUserLimit(),
                request.getScopeType(),
                request.getScopeId(),
                request.getUserEligibilityType(),
                request.getInactiveDaysThreshold(),
                request.getFirstOrderOnly(),
                request.getActive()
        );
        Coupon saved = couponRepository.save(coupon);
        putCache(saved);
        logEvent(saved.getId(), saved.getCode(), null, CouponEventType.UPDATED, null, "Coupon updated");
        return toResponse(saved);
    }

    @Override
    public List<CouponResponse> findAllCoupons() {
        return couponRepository.findAll().stream()
                .sorted(Comparator.comparing(Coupon::getId, Comparator.nullsLast(Long::compareTo)).reversed())
                .map(this::toResponse)
                .toList();
    }

    @Override
    @PreAuthorize("hasRole('ADMIN')")
    public void deleteCoupon(Long id) {
        Coupon coupon = findCouponById(id);
        coupon.setActive(false);
        couponRepository.save(coupon);
        evictCache(coupon.getCode());
        logEvent(coupon.getId(), coupon.getCode(), null, CouponEventType.DISABLED, null, "Coupon disabled");
    }

    @Override
    @PreAuthorize("hasRole('ADMIN')")
    public void mapCouponUsers(Long couponId, List<Long> userIds) {
        Coupon coupon = findCouponById(couponId);
        Set<Long> uniqueUserIds = sanitizeUserIds(userIds);
        if (!uniqueUserIds.isEmpty()) {
            long existingUsers = userRepository.findAllById(uniqueUserIds).size();
            if (existingUsers != uniqueUserIds.size()) {
                throw couponValidation("USER_NOT_FOUND", "One or more users were not found");
            }
        }

        couponUserMapRepository.deleteByCouponId(couponId);
        for (Long userId : uniqueUserIds) {
            CouponUserMap map = new CouponUserMap();
            map.setCouponId(couponId);
            map.setUserId(userId);
            couponUserMapRepository.save(map);
        }
        logEvent(coupon.getId(), coupon.getCode(), null, CouponEventType.UPDATED, null, "Coupon user mapping updated");
    }

    @Override
    @Scheduled(cron = "${app.coupon.expiry-cron:0 */30 * * * *}")
    public void expireOutdatedCoupons() {
        LocalDate today = LocalDate.now();
        List<Coupon> expiredCoupons = couponRepository.findByIsActiveTrueAndValidityEndDateBefore(today);
        for (Coupon coupon : expiredCoupons) {
            coupon.setActive(false);
            couponRepository.save(coupon);
            evictCache(coupon.getCode());
            logEvent(coupon.getId(), coupon.getCode(), null, CouponEventType.EXPIRED, "COUPON_EXPIRED", "Coupon auto expired");
        }
    }

    @Override
    public void validateAppliedCoupon(User user, Cart cart) {
        if (cart == null || cart.getCouponCode() == null || cart.getCouponCode().isBlank()) {
            return;
        }

        Coupon coupon = requireCoupon(cart.getCouponCode());
        validateCouponEligibility(coupon, user, cart);
        logEvent(
                coupon.getId(),
                coupon.getCode(),
                user.getId(),
                CouponEventType.CHECKOUT_VALIDATED,
                null,
                "Coupon revalidated at checkout"
        );
    }

    @Override
    public void markCouponUsedIfPresent(User user, Collection<Order> orders) {
        if (orders == null || orders.isEmpty()) {
            return;
        }

        Order primaryOrder = orders.stream()
                .min(Comparator.comparing(Order::getId, Comparator.nullsLast(Long::compareTo)))
                .orElse(null);
        if (primaryOrder == null || primaryOrder.getCouponCode() == null || primaryOrder.getCouponCode().isBlank()) {
            return;
        }

        couponRepository.findByCodeForUpdate(primaryOrder.getCouponCode()).ifPresent(coupon -> {
            if (couponUsageRepository.existsByCouponIdAndOrderId(coupon.getId(), primaryOrder.getId())) {
                return;
            }

            int reservedCount = coupon.getReservedCount() == null ? 0 : coupon.getReservedCount();
            if (reservedCount > 0) {
                coupon.setReservedCount(reservedCount - 1);
            }

            CouponUsage usage = new CouponUsage();
            usage.setCoupon(coupon);
            usage.setUser(user);
            usage.setOrderId(primaryOrder.getId());
            usage.setCouponCode(coupon.getCode());
            usage.setDiscountAmount(roundCurrency(
                    orders.stream().mapToDouble(order -> order.getDiscount()).sum()
            ));
            usage.setUsedAt(LocalDateTime.now());
            couponUsageRepository.save(usage);

            int nextUsedCount = coupon.getUsedCount() == null ? 1 : coupon.getUsedCount() + 1;
            coupon.setUsedCount(nextUsedCount);
            couponRepository.save(coupon);
            putCache(coupon);
            logEvent(coupon.getId(), coupon.getCode(), user.getId(), CouponEventType.CONSUMED, null, "Coupon consumed after successful order");
        });
    }

    @Override
    public String reserveCouponForCheckout(User user, Cart cart, String reservationRef) {
        if (cart == null || cart.getCouponCode() == null || cart.getCouponCode().isBlank()) {
            return null;
        }

        String couponCode = normalizeCode(cart.getCouponCode());
        Coupon coupon = couponRepository.findByCodeForUpdate(couponCode)
                .orElseThrow(() -> couponNotFound(couponCode));
        validateCouponEligibility(coupon, user, cart);

        int reservedCount = coupon.getReservedCount() == null ? 0 : coupon.getReservedCount();
        int usedCount = coupon.getUsedCount() == null ? 0 : coupon.getUsedCount();
        if (coupon.getUsageLimit() != null && usedCount + reservedCount >= coupon.getUsageLimit()) {
            throw couponValidation("USAGE_LIMIT_REACHED", "Coupon usage limit reached");
        }

        coupon.setReservedCount(reservedCount + 1);
        couponRepository.save(coupon);
        putCache(coupon);
        logEvent(
                coupon.getId(),
                coupon.getCode(),
                user == null ? null : user.getId(),
                CouponEventType.RESERVED,
                "CHECKOUT_RESERVATION",
                reservationRef == null ? "Coupon reserved for checkout" : "Coupon reserved for checkout: " + reservationRef
        );
        return coupon.getCode();
    }

    @Override
    public String reserveCouponForOrders(User user, Collection<Order> orders, String reservationRef) {
        if (orders == null || orders.isEmpty()) {
            return null;
        }
        Order primaryOrder = orders.stream()
                .min(Comparator.comparing(Order::getId, Comparator.nullsLast(Long::compareTo)))
                .orElse(null);
        if (primaryOrder == null || primaryOrder.getCouponCode() == null || primaryOrder.getCouponCode().isBlank()) {
            return null;
        }

        String couponCode = normalizeCode(primaryOrder.getCouponCode());
        Coupon coupon = couponRepository.findByCodeForUpdate(couponCode)
                .orElseThrow(() -> couponNotFound(couponCode));

        int reservedCount = coupon.getReservedCount() == null ? 0 : coupon.getReservedCount();
        int usedCount = coupon.getUsedCount() == null ? 0 : coupon.getUsedCount();
        if (coupon.getUsageLimit() != null && usedCount + reservedCount >= coupon.getUsageLimit()) {
            throw couponValidation("USAGE_LIMIT_REACHED", "Coupon usage limit reached");
        }

        coupon.setReservedCount(reservedCount + 1);
        couponRepository.save(coupon);
        putCache(coupon);
        logEvent(
                coupon.getId(),
                coupon.getCode(),
                user == null ? null : user.getId(),
                CouponEventType.RESERVED,
                "RETRY_RESERVATION",
                reservationRef == null ? "Coupon reserved for retry" : "Coupon reserved for retry: " + reservationRef
        );
        return coupon.getCode();
    }

    @Override
    public void releaseCouponReservation(String couponCode, Long userId, String reasonCode, String note) {
        if (couponCode == null || couponCode.isBlank()) {
            return;
        }
        couponRepository.findByCodeForUpdate(couponCode).ifPresent(coupon -> {
            int reservedCount = coupon.getReservedCount() == null ? 0 : coupon.getReservedCount();
            if (reservedCount <= 0) {
                return;
            }
            coupon.setReservedCount(reservedCount - 1);
            couponRepository.save(coupon);
            putCache(coupon);
            logEvent(
                    coupon.getId(),
                    coupon.getCode(),
                    userId,
                    CouponEventType.RELEASED,
                    reasonCode == null ? "RESERVATION_RELEASED" : reasonCode,
                    note == null || note.isBlank() ? "Coupon reservation released" : note
            );
        });
    }

    @Override
    public void restoreCouponUsageForCancelledOrders(User user, Collection<Order> orders, String note) {
        if (orders == null || orders.isEmpty()) {
            return;
        }

        for (Order order : orders) {
            if (order == null || order.getId() == null || order.getCouponCode() == null || order.getCouponCode().isBlank()) {
                continue;
            }
            couponRepository.findByCodeIgnoreCase(order.getCouponCode()).ifPresent(coupon -> {
                couponUsageRepository.findByCouponIdAndOrderId(coupon.getId(), order.getId()).ifPresent(usage -> {
                    couponUsageRepository.delete(usage);
                    int currentUsedCount = coupon.getUsedCount() == null ? 0 : coupon.getUsedCount();
                    coupon.setUsedCount(Math.max(0, currentUsedCount - 1));
                    couponRepository.save(coupon);
                    putCache(coupon);
                    Long userId = user != null ? user.getId() : (order.getUser() != null ? order.getUser().getId() : null);
                    logEvent(
                            coupon.getId(),
                            coupon.getCode(),
                            userId,
                            CouponEventType.RESTORED,
                            "ORDER_CANCELLED",
                            note == null || note.isBlank() ? "Coupon usage restored after cancellation" : note
                    );
                });
            });
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> recommendCoupon(User user) {
        Cart cart = requireCart(user);
        double subtotal = calculateCartSubtotal(cart);
        LocalDate today = LocalDate.now();
        long orderCount = orderRepository.countByUserId(user.getId());
        String experimentGroup = user.getId() != null && user.getId() % 2 == 0 ? "A" : "B";

        Coupon winner = null;
        double winnerDiscount = 0;
        String winnerReason = null;

        List<Coupon> candidates = couponRepository.findAll().stream()
                .filter(Objects::nonNull)
                .filter(Coupon::isActive)
                .filter(coupon -> coupon.getValidityStartDate() == null || !today.isBefore(coupon.getValidityStartDate()))
                .filter(coupon -> coupon.getValidityEndDate() == null || !today.isAfter(coupon.getValidityEndDate()))
                .toList();

        for (Coupon coupon : candidates) {
            try {
                validateCouponEligibility(coupon, user, cart);
            } catch (CouponOperationException ignored) {
                continue;
            }

            double applicableSubtotal = calculateApplicableSubtotal(coupon, cart);
            if (applicableSubtotal <= 0) {
                continue;
            }
            double discount = estimateDiscount(coupon, applicableSubtotal);
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
        response.put("cartSubtotal", roundCurrency(subtotal));
        response.put("eligibleCouponCount", candidates.size());

        if (winner == null) {
            response.put("recommended", false);
            response.put("message", "No eligible coupon found for current cart.");
            return response;
        }

        response.put("recommended", true);
        response.put("couponCode", winner.getCode());
        response.put("estimatedDiscount", roundCurrency(winnerDiscount));
        response.put("reason", winnerReason);
        response.put("scopeType", winner.getScopeType() == null ? CouponScopeType.GLOBAL.name() : winner.getScopeType().name());
        response.put("minimumOrderValue", winner.getMinimumOrderValue());
        logEvent(winner.getId(), winner.getCode(), user.getId(), CouponEventType.RECOMMENDED, "AB_GROUP_" + experimentGroup, "Coupon recommendation served");
        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> couponMetrics(int days) {
        int effectiveDays = days <= 0 ? 30 : Math.min(days, 365);
        LocalDateTime from = LocalDateTime.now().minusDays(effectiveDays);

        long applyCount = couponEventLogRepository.countByEventTypeAndCreatedAtAfter(CouponEventType.APPLIED, from);
        long rejectCount = couponEventLogRepository.countByEventTypeAndCreatedAtAfter(CouponEventType.APPLY_REJECTED, from);
        long consumedCount = couponEventLogRepository.countByEventTypeAndCreatedAtAfter(CouponEventType.CONSUMED, from);
        long restoredCount = couponEventLogRepository.countByEventTypeAndCreatedAtAfter(CouponEventType.RESTORED, from);
        long usageCount = couponUsageRepository.countByUsedAtAfter(from);
        Double summedDiscount = couponUsageRepository.sumDiscountAmountByUsedAtAfter(from);
        double totalDiscountGiven = roundCurrency(summedDiscount == null ? 0 : summedDiscount);

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
        response.put("conversionRatePercent", roundCurrency(conversion));
        response.put("rejectionRatePercent", roundCurrency(rejectionRate));
        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> couponMonitoringSnapshot(int windowMinutes) {
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
        response.put("rejectRatePercent", roundCurrency(rejectRate));
        response.put("cacheHits", cacheHits);
        response.put("cacheMisses", cacheMisses);
        response.put("cacheHitRatePercent", roundCurrency(cacheHitRate));
        response.put("cacheSize", couponCache.size());
        response.put("cacheTtlSeconds", CACHE_TTL_SECONDS);
        response.put("alert", applies >= 20 && rejectRate >= 40.0);
        return response;
    }

    @Scheduled(cron = "${app.coupon.monitor-cron:0 */10 * * * *}")
    public void monitorCouponFlow() {
        Map<String, Object> snapshot = couponMonitoringSnapshot(10);
        Object alert = snapshot.get("alert");
        if (Boolean.TRUE.equals(alert)) {
            log.warn("Coupon alert: {}", snapshot);
            logEvent(null, null, null, CouponEventType.ALERT_TRIGGERED, "HIGH_REJECT_RATE", String.valueOf(snapshot));
        }
    }

    @Scheduled(cron = "${app.coupon.cache-evict-cron:0 */2 * * * *}")
    public void evictExpiredCouponCacheEntries() {
        couponCache.entrySet().removeIf(entry ->
                entry.getValue() == null || entry.getValue().isExpired()
        );
    }

    private Cart requireCart(User user) {
        Cart cart = cartRepository.findByUserId(user.getId());
        if (cart == null) {
            throw new IllegalArgumentException("Cart not found");
        }
        return cart;
    }

    private Coupon requireCoupon(String code) {
        String normalizedCode = normalizeCode(code);
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
                .orElseThrow(() -> couponNotFound(normalizedCode));
        putCache(coupon);
        return coupon;
    }

    private void validateCouponEligibility(Coupon coupon, User user, Cart cart) {
        double subtotal = calculateCartSubtotal(cart);
        if (!coupon.isActive()) {
            throw couponValidation("COUPON_INACTIVE", "Coupon is not active");
        }
        if (user.getAccountStatus() != AccountStatus.ACTIVE) {
            throw couponValidation("USER_INACTIVE", "Only active users can use coupons");
        }
        if (subtotal <= 0) {
            throw couponValidation("CART_EMPTY", "Cart is empty");
        }
        if (subtotal < coupon.getMinimumOrderValue()) {
            throw couponValidation(
                    "MIN_ORDER_NOT_MET",
                    "Valid for minimum order value " + roundCurrency(coupon.getMinimumOrderValue())
            );
        }

        LocalDate today = LocalDate.now();
        boolean afterStart = coupon.getValidityStartDate() == null || !today.isBefore(coupon.getValidityStartDate());
        boolean beforeEnd = coupon.getValidityEndDate() == null || !today.isAfter(coupon.getValidityEndDate());
        if (!afterStart || !beforeEnd) {
            throw couponValidation("COUPON_EXPIRED", "Coupon not valid");
        }

        int usedCount = coupon.getUsedCount() == null ? 0 : coupon.getUsedCount();
        int reservedCount = coupon.getReservedCount() == null ? 0 : coupon.getReservedCount();
        if (coupon.getUsageLimit() != null && usedCount + reservedCount >= coupon.getUsageLimit()) {
            throw couponValidation("USAGE_LIMIT_REACHED", "Coupon usage limit reached");
        }

        long userOrderCount = orderRepository.countByUserId(user.getId());
        long usedByUser = couponUsageRepository.countByCouponIdAndUserId(coupon.getId(), user.getId());
        int perUserLimit = coupon.getPerUserLimit() == null ? 1 : coupon.getPerUserLimit();
        if (usedByUser >= perUserLimit) {
            throw couponValidation("PER_USER_LIMIT_REACHED", "Per user coupon limit reached");
        }

        if (Boolean.TRUE.equals(coupon.isFirstOrderOnly()) && userOrderCount > 0) {
            throw couponValidation("FIRST_ORDER_ONLY", "This coupon is valid for first order only");
        }

        validateAdvancedUserEligibility(coupon, user, userOrderCount);

        if (couponUserMapRepository.countByCouponId(coupon.getId()) > 0
                && !couponUserMapRepository.existsByCouponIdAndUserId(coupon.getId(), user.getId())) {
            throw couponValidation("USER_NOT_ELIGIBLE", "You are not eligible for this coupon");
        }

        double applicableSubtotal = calculateApplicableSubtotal(coupon, cart);
        if (applicableSubtotal <= 0) {
            throw couponValidation("NOT_APPLICABLE_TO_CART", "Coupon is not applicable to current cart items");
        }
    }

    private void validateAdvancedUserEligibility(Coupon coupon, User user, long userOrderCount) {
        CouponUserEligibilityType eligibilityType = coupon.getUserEligibilityType() == null
                ? CouponUserEligibilityType.ALL_USERS
                : coupon.getUserEligibilityType();

        if (eligibilityType == CouponUserEligibilityType.ALL_USERS) {
            return;
        }
        if (eligibilityType == CouponUserEligibilityType.NEW_USERS_ONLY && userOrderCount > 0) {
            throw couponValidation("NEW_USERS_ONLY", "This coupon is only valid for new users");
        }
        if (eligibilityType == CouponUserEligibilityType.RETURNING_USERS_ONLY && userOrderCount == 0) {
            throw couponValidation("RETURNING_USERS_ONLY", "This coupon is only valid for returning users");
        }
        if (eligibilityType == CouponUserEligibilityType.INACTIVE_USERS_ONLY) {
            if (userOrderCount == 0) {
                throw couponValidation("INACTIVE_USERS_ONLY", "This coupon is for inactive users with prior orders");
            }
            int inactiveDays = coupon.getInactiveDaysThreshold() == null || coupon.getInactiveDaysThreshold() < 1
                    ? 30
                    : coupon.getInactiveDaysThreshold();
            Order latestOrder = orderRepository.findTopByUserIdOrderByOrderDateDesc(user.getId()).orElse(null);
            LocalDateTime latestOrderDate = latestOrder == null ? null : latestOrder.getOrderDate();
            if (latestOrderDate == null || latestOrderDate.isAfter(LocalDateTime.now().minusDays(inactiveDays))) {
                throw couponValidation(
                        "INACTIVE_DAYS_NOT_MET",
                        "This coupon is valid for users inactive for at least " + inactiveDays + " days"
                );
            }
        }
    }

    private double calculateCartSubtotal(Cart cart) {
        if (cart.getCartItems() == null) {
            return 0;
        }
        return cart.getCartItems().stream()
                .map(CartItem::getSellingPrice)
                .filter(value -> value != null)
                .mapToDouble(Integer::doubleValue)
                .sum();
    }

    private double calculateApplicableSubtotal(Coupon coupon, Cart cart) {
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

    private boolean isItemApplicable(Coupon coupon, CartItem item) {
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

    private CouponResponse toResponse(Coupon coupon) {
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
        response.setMappedUserCount(couponUserMapRepository.countByCouponId(coupon.getId()));
        response.setActive(coupon.isActive());
        return response;
    }

    private String normalizeCode(String code) {
        if (code == null || code.isBlank()) {
            throw couponValidation("COUPON_CODE_REQUIRED", "Coupon code is required");
        }
        return code.trim().toUpperCase(Locale.ROOT);
    }

    private double roundCurrency(double value) {
        return Math.round(value * 100.0) / 100.0;
    }

    private void validateCreateOrUpdateRequest(
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
            Long existingCouponId
    ) {
        if (discountType == null) {
            throw couponValidation("DISCOUNT_TYPE_REQUIRED", "Discount type is required");
        }
        if (discountValue == null || discountValue <= 0) {
            throw couponValidation("DISCOUNT_VALUE_INVALID", "Discount value must be greater than 0");
        }
        if (minimumOrderValue == null || minimumOrderValue < 0) {
            throw couponValidation("MIN_ORDER_INVALID", "Minimum order value cannot be negative");
        }
        if (startDate == null || endDate == null) {
            throw couponValidation("COUPON_DATE_REQUIRED", "Start and end date are required");
        }
        if (endDate.isBefore(startDate)) {
            throw couponValidation("COUPON_DATE_INVALID", "End date cannot be before start date");
        }
        if (discountType == CouponDiscountType.PERCENT && discountValue > 100) {
            throw couponValidation("DISCOUNT_PERCENT_INVALID", "Percent discount cannot exceed 100");
        }
        if (usageLimit != null && usageLimit < 1) {
            throw couponValidation("USAGE_LIMIT_INVALID", "Usage limit must be at least 1");
        }
        if (perUserLimit != null && perUserLimit < 1) {
            throw couponValidation("PER_USER_LIMIT_INVALID", "Per user limit must be at least 1");
        }
        if (usageLimit != null && perUserLimit != null && perUserLimit > usageLimit) {
            throw couponValidation("PER_USER_LIMIT_INVALID", "Per user limit cannot exceed usage limit");
        }
        CouponScopeType effectiveScopeType = scopeType == null ? CouponScopeType.GLOBAL : scopeType;
        if (effectiveScopeType != CouponScopeType.GLOBAL && scopeId == null) {
            throw couponValidation("SCOPE_ID_REQUIRED", "Scope id is required for selected scope type");
        }
        CouponUserEligibilityType effectiveEligibilityType = userEligibilityType == null
                ? CouponUserEligibilityType.ALL_USERS
                : userEligibilityType;
        if (Boolean.TRUE.equals(firstOrderOnly)
                && effectiveEligibilityType != CouponUserEligibilityType.ALL_USERS
                && effectiveEligibilityType != CouponUserEligibilityType.NEW_USERS_ONLY) {
            throw couponValidation(
                    "ELIGIBILITY_CONFLICT",
                    "firstOrderOnly can only be used with ALL_USERS or NEW_USERS_ONLY eligibility"
            );
        }
        if (effectiveEligibilityType == CouponUserEligibilityType.INACTIVE_USERS_ONLY
                && (inactiveDaysThreshold == null || inactiveDaysThreshold < 1)) {
            throw couponValidation(
                    "INACTIVE_DAYS_REQUIRED",
                    "Inactive days threshold is required for INACTIVE_USERS_ONLY eligibility"
            );
        }
        if (effectiveEligibilityType != CouponUserEligibilityType.INACTIVE_USERS_ONLY
                && inactiveDaysThreshold != null
                && inactiveDaysThreshold < 1) {
            throw couponValidation("INACTIVE_DAYS_INVALID", "Inactive days threshold must be at least 1");
        }
        if (existingCouponId == null) {
            return;
        }
        couponRepository.findByCodeIgnoreCase(normalizedCode).ifPresent(existing -> {
            if (!existingCouponId.equals(existing.getId())) {
                throw couponDuplicate();
            }
        });
    }

    private void applyRequestToCoupon(
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
        coupon.setDiscountValue(roundCurrency(discountValue));
        coupon.setDiscountPercentage(
                discountType == CouponDiscountType.PERCENT
                        ? roundCurrency(discountValue)
                        : roundCurrency(discountPercentage == null ? 0.0 : discountPercentage)
        );
        coupon.setMaxDiscount(maxDiscount == null ? null : roundCurrency(maxDiscount));
        coupon.setMinimumOrderValue(roundCurrency(minimumOrderValue));
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

    private void enforceFraudThrottle(User user, String clientIp, String deviceId) {
        if (user == null || user.getId() == null) {
            return;
        }
        LocalDateTime now = LocalDateTime.now();
        long recentAttempts = couponEventLogRepository.countByUserIdAndCreatedAtAfter(
                user.getId(),
                now.minusMinutes(2)
        );
        if (recentAttempts >= MAX_COUPON_ATTEMPTS_PER_2_MIN) {
            throw couponValidation(
                    "COUPON_RATE_LIMIT",
                    "Too many coupon attempts. Please wait a moment before retrying."
            );
        }

        long recentRejects = couponEventLogRepository.countByUserIdAndEventTypeAndCreatedAtAfter(
                user.getId(),
                CouponEventType.APPLY_REJECTED,
                now.minusMinutes(10)
        );
        if (recentRejects >= MAX_COUPON_REJECTS_PER_10_MIN) {
            throw couponValidation(
                    "COUPON_SUSPICIOUS_ACTIVITY",
                    "Coupon usage temporarily restricted due to repeated invalid attempts."
            );
        }

        String normalizedIp = clientIp == null ? null : clientIp.trim();
        if (normalizedIp != null && !normalizedIp.isBlank()) {
            String ipToken = "ip=" + normalizedIp;
            long ipRejects = couponEventLogRepository.countByEventTypeAndNoteContainingAndCreatedAtAfter(
                    CouponEventType.APPLY_REJECTED,
                    ipToken,
                    now.minusMinutes(10)
            );
            if (ipRejects >= MAX_IP_REJECTS_PER_10_MIN) {
                throw couponValidation(
                        "COUPON_IP_BLOCKED",
                        "Too many invalid coupon attempts from this network. Please retry later."
                );
            }
        }

        String normalizedDevice = deviceId == null ? null : deviceId.trim();
        if (normalizedDevice != null && !normalizedDevice.isBlank()) {
            String deviceToken = "device=" + normalizedDevice;
            long deviceRejects = couponEventLogRepository.countByEventTypeAndNoteContainingAndCreatedAtAfter(
                    CouponEventType.APPLY_REJECTED,
                    deviceToken,
                    now.minusMinutes(10)
            );
            if (deviceRejects >= MAX_DEVICE_REJECTS_PER_10_MIN) {
                throw couponValidation(
                        "COUPON_DEVICE_BLOCKED",
                        "Coupon activity from this device is temporarily restricted."
                );
            }

            long deviceAttempts = couponEventLogRepository.countByNoteContainingAndCreatedAtAfter(
                    deviceToken,
                    now.minusMinutes(2)
            );
            if (deviceAttempts >= MAX_DEVICE_ATTEMPTS_PER_2_MIN) {
                throw couponValidation(
                        "COUPON_DEVICE_RATE_LIMIT",
                        "Too many coupon attempts from this device. Please wait and try again."
                );
            }
        }
    }

    private double estimateDiscount(Coupon coupon, double applicableSubtotal) {
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
        return roundCurrency(Math.min(discount, applicableSubtotal));
    }

    private String formatContext(String clientIp, String deviceId) {
        String normalizedIp = clientIp == null ? "" : clientIp.trim();
        String normalizedDevice = deviceId == null ? "" : deviceId.trim();
        if (normalizedIp.isEmpty() && normalizedDevice.isEmpty()) {
            return "";
        }
        LinkedHashMap<String, String> context = new LinkedHashMap<>();
        if (!normalizedIp.isEmpty()) {
            context.put("ip", normalizedIp);
        }
        if (!normalizedDevice.isEmpty()) {
            context.put("device", normalizedDevice);
        }
        return " context=" + context;
    }

    private void putCache(Coupon coupon) {
        if (coupon == null || coupon.getCode() == null || coupon.getCode().isBlank()) {
            return;
        }
        couponCache.put(
                coupon.getCode().trim().toUpperCase(Locale.ROOT),
                new CouponCacheEntry(coupon, LocalDateTime.now().plusSeconds(CACHE_TTL_SECONDS))
        );
    }

    private void evictCache(String code) {
        if (code == null || code.isBlank()) {
            return;
        }
        couponCache.remove(code.trim().toUpperCase(Locale.ROOT));
    }

    private CouponOperationException couponValidation(String reasonCode, String message) {
        return new CouponOperationException(
                HttpStatus.UNPROCESSABLE_ENTITY,
                ApiErrorCode.VALIDATION_ERROR,
                reasonCode,
                message
        );
    }

    private CouponOperationException couponNotFound(String couponIdentifier) {
        return new CouponOperationException(
                HttpStatus.NOT_FOUND,
                ApiErrorCode.RESOURCE_NOT_FOUND,
                "COUPON_NOT_FOUND",
                "Coupon not found",
                java.util.Map.of("coupon", couponIdentifier)
        );
    }

    private CouponOperationException couponDuplicate() {
        return new CouponOperationException(
                HttpStatus.CONFLICT,
                ApiErrorCode.DUPLICATE_RESOURCE,
                "COUPON_CODE_EXISTS",
                "Coupon code already exists"
        );
    }

    private Set<Long> sanitizeUserIds(List<Long> userIds) {
        if (userIds == null) {
            return Set.of();
        }
        return userIds.stream()
                .filter(value -> value != null && value > 0)
                .collect(java.util.stream.Collectors.toCollection(LinkedHashSet::new));
    }

    private void logEvent(
            Long couponId,
            String couponCode,
            Long userId,
            CouponEventType eventType,
            String reasonCode,
            String note
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

    private record CouponCacheEntry(Coupon coupon, LocalDateTime expiresAt) {
        private boolean isExpired() {
            return expiresAt == null || LocalDateTime.now().isAfter(expiresAt);
        }
    }
}






