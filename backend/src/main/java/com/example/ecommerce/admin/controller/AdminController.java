package com.example.ecommerce.admin.controller;

import com.example.ecommerce.common.domain.AccountStatus;
import com.example.ecommerce.common.domain.OrderStatus;
import com.example.ecommerce.common.domain.UserRole;
import com.example.ecommerce.common.mapper.ResponseMapper;
import com.example.ecommerce.modal.AuditLogEntry;
import com.example.ecommerce.modal.User;
import com.example.ecommerce.admin.response.AdminDashboardSummaryResponse;
import com.example.ecommerce.admin.response.AdminOrderSummaryResponse;
import com.example.ecommerce.admin.response.AdminProductSummaryResponse;
import com.example.ecommerce.admin.response.AdminSalesReportResponse;
import com.example.ecommerce.admin.response.AdminTransactionSummaryResponse;
import com.example.ecommerce.admin.response.AdminUserSummaryResponse;
import com.example.ecommerce.repository.AuditLogEntryRepository;
import com.example.ecommerce.seller.response.SellerResponse;
import com.example.ecommerce.user.response.UserProfileResponse;
import com.example.ecommerce.admin.service.AdminService;
import com.example.ecommerce.inventory.service.RestockNotificationService;
import com.example.ecommerce.order.service.CouponService;
import com.example.ecommerce.order.service.OrderService;
import com.example.ecommerce.seller.service.SellerService;
import com.example.ecommerce.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {
    private final SellerService sellerService;
    private final UserService userService;
    private final AdminService adminService;
    private final OrderService orderService;
    private final CouponService couponService;
    private final RestockNotificationService restockNotificationService;
    private final AuditLogEntryRepository auditLogEntryRepository;

    @GetMapping("/profile")
    public ResponseEntity<UserProfileResponse> getAdminProfile(
            @RequestHeader(value = "Authorization", required = false) String jwt
    ) throws Exception {
        User user = userService.findUserByJwtToken(jwt);
        if (user.getRole() != UserRole.ROLE_ADMIN) {
            throw new AccessDeniedException("Admin access required");
        }

        UserProfileResponse response = new UserProfileResponse();
        response.setId(user.getId());
        response.setFullName(user.getFullName());
        response.setEmail(user.getEmail());
        response.setMobileNumber(user.getMobileNumber());
        response.setRole(user.getRole());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/dashboard/summary")
    public ResponseEntity<AdminDashboardSummaryResponse> getDashboardSummary() {
        return ResponseEntity.ok(adminService.getDashboardSummary());
    }

    @GetMapping("/users")
    public ResponseEntity<List<AdminUserSummaryResponse>> getUsers() {
        return ResponseEntity.ok(adminService.getUsers());
    }

    @PatchMapping("/users/{id}/status/{status}")
    public ResponseEntity<AdminUserSummaryResponse> updateUserStatus(
            @PathVariable Long id,
            @PathVariable AccountStatus status
    ) throws Exception {
        return ResponseEntity.ok(adminService.updateUserStatus(id, status));
    }

    @GetMapping("/products")
    public ResponseEntity<List<AdminProductSummaryResponse>> getProducts() {
        return ResponseEntity.ok(adminService.getProducts());
    }

    @GetMapping("/notify-demand")
    public ResponseEntity<Map<String, Object>> getNotifyDemandInsights() {
        return ResponseEntity.ok(restockNotificationService.getAdminDemandInsights());
    }

    @GetMapping("/audit-logs")
    public ResponseEntity<List<Map<String, Object>>> getAuditLogs(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String actor,
            @RequestParam(required = false) String method,
            @RequestParam(required = false) Integer status,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(defaultValue = "200") Integer limit
    ) {
        int normalizedLimit = Math.max(20, Math.min(limit == null ? 200 : limit, 500));
        String query = normalize(q);
        String actorQuery = normalize(actor);
        String methodQuery = normalize(method);
        LocalDateTime fromDate = parseDateBoundary(from, true);
        LocalDateTime toDate = parseDateBoundary(to, false);

        List<Map<String, Object>> response = auditLogEntryRepository.findAll().stream()
                .sorted((left, right) -> {
                    LocalDateTime rightCreatedAt = right.getCreatedAt() == null ? LocalDateTime.MIN : right.getCreatedAt();
                    LocalDateTime leftCreatedAt = left.getCreatedAt() == null ? LocalDateTime.MIN : left.getCreatedAt();
                    return rightCreatedAt.compareTo(leftCreatedAt);
                })
                .filter(entry -> query == null || containsAny(entry, query))
                .filter(entry -> actorQuery == null || normalize(entry.getActor()).contains(actorQuery))
                .filter(entry -> methodQuery == null || methodQuery.equals(normalize(entry.getMethod())))
                .filter(entry -> status == null || status.equals(entry.getStatus()))
                .filter(entry -> fromDate == null || !safeCreatedAt(entry).isBefore(fromDate))
                .filter(entry -> toDate == null || !safeCreatedAt(entry).isAfter(toDate))
                .limit(normalizedLimit)
                .map(this::toAuditLogResponse)
                .toList();

        return ResponseEntity.ok(response);
    }

    @GetMapping("/orders")
    public ResponseEntity<List<AdminOrderSummaryResponse>> getOrders() {
        return ResponseEntity.ok(adminService.getOrders());
    }

    @PostMapping("/orders/{id}/confirm")
    public ResponseEntity<Map<String, Object>> confirmOrder(@PathVariable Long id) throws Exception {
        return ResponseEntity.ok(toOrderActionResponse(orderService.updateOrderStatusByAdmin(id, OrderStatus.CONFIRMED)));
    }

    @PostMapping("/orders/{id}/pack")
    public ResponseEntity<Map<String, Object>> packOrder(@PathVariable Long id) throws Exception {
        return ResponseEntity.ok(toOrderActionResponse(orderService.updateOrderStatusByAdmin(id, OrderStatus.PACKED)));
    }

    @PostMapping("/orders/{id}/ship")
    public ResponseEntity<Map<String, Object>> shipOrder(@PathVariable Long id) throws Exception {
        return ResponseEntity.ok(toOrderActionResponse(orderService.updateOrderStatusByAdmin(id, OrderStatus.SHIPPED)));
    }

    @PostMapping("/orders/{id}/cancel")
    public ResponseEntity<Map<String, Object>> cancelOrder(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, Object> payload
    ) throws Exception {
        String cancelReasonCode = payload == null || payload.get("cancelReasonCode") == null
                ? "ADMIN_CANCELLED"
                : String.valueOf(payload.get("cancelReasonCode"));
        String cancelReasonText = payload == null || payload.get("cancelReasonText") == null
                ? "Cancelled by warehouse admin before shipment"
                : String.valueOf(payload.get("cancelReasonText"));
        com.example.ecommerce.modal.Order order = orderService.cancelOrderByAdmin(id, cancelReasonCode, cancelReasonText);
        couponService.releaseCouponReservation(
                order.getCouponCode(),
                order.getUser() == null ? null : order.getUser().getId(),
                "ORDER_CANCELLED_BY_ADMIN",
                "Reservation released due to admin cancellation"
        );
        couponService.restoreCouponUsageForCancelledOrders(
                order.getUser(),
                java.util.List.of(order),
                "Order cancelled by admin before shipment"
        );
        return ResponseEntity.ok(
                toOrderActionResponse(order)
        );
    }

    @GetMapping("/payments")
    public ResponseEntity<List<AdminTransactionSummaryResponse>> getPayments() {
        return ResponseEntity.ok(adminService.getPayments());
    }

    @GetMapping("/reports/sales")
    public ResponseEntity<AdminSalesReportResponse> getSalesReport() {
        return ResponseEntity.ok(adminService.getSalesReport());
    }

    @PostMapping("/seller/{id}/status/{status}")
    public ResponseEntity<SellerResponse> updateSellerStatus(
            @PathVariable Long id,
            @PathVariable AccountStatus status
    ) throws Exception {
        return ResponseEntity.ok(ResponseMapper.toSellerResponse(sellerService.updateSellerAccountStatus(id, status)));
    }

    private Map<String, Object> toOrderActionResponse(com.example.ecommerce.modal.Order order) {
        LinkedHashMap<String, Object> response = new LinkedHashMap<>();
        response.put("id", order.getId());
        response.put("orderStatus", order.getOrderStatus() == null ? null : order.getOrderStatus().name());
        response.put("shippedAt", order.getShippedAt());
        response.put("cancelledAt", order.getCancelledAt());
        response.put("deliveredAt", order.getDeliveredAt());
        return response;
    }

    private Map<String, Object> toAuditLogResponse(AuditLogEntry entry) {
        LinkedHashMap<String, Object> response = new LinkedHashMap<>();
        response.put("id", entry.getId());
        response.put("method", entry.getMethod());
        response.put("path", entry.getPath());
        response.put("status", entry.getStatus());
        response.put("actor", entry.getActor());
        response.put("ipAddress", entry.getIpAddress());
        response.put("durationMs", entry.getDurationMs());
        response.put("createdAt", entry.getCreatedAt());
        return response;
    }

    private boolean containsAny(AuditLogEntry entry, String query) {
        return java.util.stream.Stream.of(
                        entry.getMethod(),
                        entry.getPath(),
                        entry.getActor(),
                        entry.getIpAddress(),
                        entry.getStatus() == null ? null : String.valueOf(entry.getStatus())
                )
                .filter(value -> value != null && !value.isBlank())
                .anyMatch(value -> normalize(value).contains(query));
    }

    private LocalDateTime safeCreatedAt(AuditLogEntry entry) {
        return entry.getCreatedAt() == null ? LocalDateTime.MIN : entry.getCreatedAt();
    }

    private LocalDateTime parseDateBoundary(String value, boolean startOfDay) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            LocalDate date = LocalDate.parse(value.trim());
            return startOfDay ? date.atStartOfDay() : date.atTime(23, 59, 59);
        } catch (DateTimeParseException exception) {
            return null;
        }
    }

    private String normalize(String value) {
        return value == null ? null : value.trim().toLowerCase();
    }
}





