package com.example.ecommerce.order.service.impl;

import com.example.ecommerce.admin.request.CreateCouponRequest;
import com.example.ecommerce.common.domain.CouponDiscountType;
import com.example.ecommerce.common.domain.CouponEventType;
import com.example.ecommerce.common.domain.CouponScopeType;
import com.example.ecommerce.common.domain.CouponUserEligibilityType;
import com.example.ecommerce.common.response.ApiErrorCode;
import com.example.ecommerce.modal.Cart;
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
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

@Service
@Slf4j
@RequiredArgsConstructor
@Transactional
public class CouponServiceImpl implements CouponService {

    private static final long CACHE_TTL_SECONDS = 180;

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
                .map(coupon -> CouponAdminSupport.toResponse(coupon, couponUserMapRepository))
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
        return CouponAnalyticsSupport.recommendCoupon(
                user,
                cart,
                couponRepository,
                orderRepository,
                couponUsageRepository,
                couponUserMapRepository,
                this::couponValidation,
                (eventType, payload) -> logEvent(
                        (Long) payload.get("couponId"),
                        (String) payload.get("couponCode"),
                        (Long) payload.get("userId"),
                        eventType,
                        (String) payload.get("reasonCode"),
                        (String) payload.get("note")
                )
        );
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> couponMetrics(int days) {
        return CouponAnalyticsSupport.couponMetrics(days, couponEventLogRepository, couponUsageRepository);
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> couponMonitoringSnapshot(int windowMinutes) {
        return CouponAnalyticsSupport.couponMonitoringSnapshot(
                windowMinutes,
                couponEventLogRepository,
                couponCacheHits,
                couponCacheMisses,
                couponCache.size(),
                CACHE_TTL_SECONDS
        );
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
        CouponEligibilitySupport.validateCouponEligibility(
                coupon,
                user,
                cart,
                orderRepository,
                couponUsageRepository,
                couponUserMapRepository,
                this::couponValidation
        );
    }

    private double calculateCartSubtotal(Cart cart) {
        return CouponEligibilitySupport.calculateCartSubtotal(cart);
    }

    private double calculateApplicableSubtotal(Coupon coupon, Cart cart) {
        return CouponEligibilitySupport.calculateApplicableSubtotal(coupon, cart);
    }

    private CouponResponse toResponse(Coupon coupon) {
        return CouponAdminSupport.toResponse(coupon, couponUserMapRepository);
    }

    private String normalizeCode(String code) {
        return CouponValueSupport.normalizeCode(code, this::couponValidation);
    }

    private double roundCurrency(double value) {
        return CouponValueSupport.roundCurrency(value);
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
        CouponAdminSupport.validateCreateOrUpdateRequest(
                normalizedCode,
                discountType,
                discountValue,
                minimumOrderValue,
                startDate,
                endDate,
                usageLimit,
                perUserLimit,
                scopeType,
                scopeId,
                userEligibilityType,
                inactiveDaysThreshold,
                firstOrderOnly,
                existingCouponId,
                couponRepository,
                this::couponValidation,
                this::couponDuplicate
        );
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
        CouponAdminSupport.applyRequestToCoupon(
                coupon,
                normalizedCode,
                discountType,
                discountValue,
                discountPercentage,
                maxDiscount,
                minimumOrderValue,
                startDate,
                endDate,
                usageLimit,
                perUserLimit,
                scopeType,
                scopeId,
                userEligibilityType,
                inactiveDaysThreshold,
                firstOrderOnly,
                active
        );
    }

    private void enforceFraudThrottle(User user, String clientIp, String deviceId) {
        CouponFraudSupport.enforceFraudThrottle(
                user == null ? null : user.getId(),
                clientIp,
                deviceId,
                couponEventLogRepository,
                this::couponValidation
        );
    }

    private double estimateDiscount(Coupon coupon, double applicableSubtotal) {
        return CouponEligibilitySupport.estimateDiscount(coupon, applicableSubtotal);
    }

    private String formatContext(String clientIp, String deviceId) {
        return CouponValueSupport.formatContext(clientIp, deviceId);
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
        return CouponValueSupport.sanitizeUserIds(userIds);
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






