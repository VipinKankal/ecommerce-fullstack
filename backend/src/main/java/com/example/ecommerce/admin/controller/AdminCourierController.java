package com.example.ecommerce.admin.controller;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

@RestController
@RequestMapping("/api/admin/couriers")
@PreAuthorize("hasRole('ADMIN')")
public class AdminCourierController {
    private static final AtomicLong ID_SEQUENCE = new AtomicLong(1000);
    private static final Map<Long, CourierRecord> COURIER_STORE = new ConcurrentHashMap<>();
    private static final Map<Long, SalaryConfigPayload> SALARY_STORE = new ConcurrentHashMap<>();

    @GetMapping
    public ResponseEntity<List<CourierRecord>> getCouriers() {
        return ResponseEntity.ok(
                COURIER_STORE.values().stream()
                        .sorted(Comparator.comparing(CourierRecord::getId))
                        .toList()
        );
    }

    @PostMapping
    public ResponseEntity<CourierRecord> createCourier(@RequestBody CreateCourierRequest request) {
        long courierId = ID_SEQUENCE.incrementAndGet();
        CourierRecord courier = new CourierRecord();
        courier.setId(courierId);
        courier.setFullName(valueOrFallback(request.getFullName(), "Courier"));
        courier.setPhone(valueOrFallback(request.getPhone(), "-"));
        courier.setEmail(request.getEmail());
        courier.setCity(valueOrFallback(request.getCity(), "-"));
        courier.setZone(valueOrFallback(request.getZone(), "Unassigned"));
        courier.setStatus(normalizeUpper(request.getStatus(), "ACTIVE"));
        courier.setKycStatus("PENDING");
        courier.setCreatedAt(LocalDateTime.now().toString());
        courier.setActiveOrders(0);
        courier.setDeliveriesThisMonth(0);
        courier.setCodSettlementFrequency(normalizeUpper(request.getCodSettlementFrequency(), "DAILY"));
        COURIER_STORE.put(courierId, courier);

        SALARY_STORE.put(courierId, sanitizeSalary(request.getSalaryConfig()));
        return new ResponseEntity<>(courier, HttpStatus.CREATED);
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<CourierRecord> updateStatus(
            @PathVariable Long id,
            @RequestParam String status
    ) throws Exception {
        CourierRecord courier = getCourier(id);
        courier.setStatus(normalizeUpper(status, courier.getStatus()));
        return ResponseEntity.ok(courier);
    }

    @PatchMapping("/{id}/cod-frequency")
    public ResponseEntity<CourierRecord> updateCodFrequency(
            @PathVariable Long id,
            @RequestBody Map<String, String> payload
    ) throws Exception {
        CourierRecord courier = getCourier(id);
        courier.setCodSettlementFrequency(
                normalizeUpper(payload == null ? null : payload.get("frequency"), courier.getCodSettlementFrequency())
        );
        return ResponseEntity.ok(courier);
    }

    @PutMapping("/{id}/salary")
    public ResponseEntity<SalaryConfigPayload> updateSalary(
            @PathVariable Long id,
            @RequestBody SalaryConfigPayload payload
    ) throws Exception {
        getCourier(id);
        SalaryConfigPayload sanitized = sanitizeSalary(payload);
        SALARY_STORE.put(id, sanitized);
        return ResponseEntity.ok(sanitized);
    }

    @GetMapping("/{id}/earnings")
    public ResponseEntity<Map<String, Object>> getCourierEarnings(
            @PathVariable Long id,
            @RequestParam(required = false) String month
    ) throws Exception {
        CourierRecord courier = getCourier(id);
        SalaryConfigPayload salaryConfig = SALARY_STORE.getOrDefault(id, defaultSalaryConfig());

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("month", month);
        response.put("monthlyBase", salaryConfig.getMonthlyBase());
        response.put("perDeliveryRate", salaryConfig.getPerDeliveryRate());
        response.put("petrolAllowanceMonthlyCap", salaryConfig.getPetrolAllowanceMonthlyCap());
        response.put("targetDeliveries", salaryConfig.getTargetDeliveries());
        response.put("incentiveAmount", salaryConfig.getIncentiveAmount());
        response.put("latePenalty", salaryConfig.getLatePenalty());
        response.put("failedPenalty", salaryConfig.getFailedPenalty());
        response.put("codMismatchPenalty", salaryConfig.getCodMismatchPenalty());
        response.put("baseSalary", salaryConfig.getMonthlyBase());
        response.put("presentDays", 0);
        response.put("payableDays", 0);
        response.put("deliveriesCount", courier.getDeliveriesThisMonth());
        response.put("perDeliveryEarnings", 0);
        response.put("petrolAllowanceApproved", 0);
        response.put("incentiveAmount", salaryConfig.getIncentiveAmount());
        response.put("penalties", 0);
        response.put("totalPayable", 0);
        response.put("payoutStatus", "DRAFT");
        return ResponseEntity.ok(response);
    }

    private CourierRecord getCourier(Long id) throws Exception {
        CourierRecord courier = COURIER_STORE.get(id);
        if (courier == null) {
            throw new Exception("Courier not found");
        }
        return courier;
    }

    private SalaryConfigPayload sanitizeSalary(SalaryConfigPayload payload) {
        if (payload == null) {
            return defaultSalaryConfig();
        }

        SalaryConfigPayload sanitized = new SalaryConfigPayload();
        sanitized.setMonthlyBase(defaultNumber(payload.getMonthlyBase()));
        sanitized.setPerDeliveryRate(defaultNumber(payload.getPerDeliveryRate()));
        sanitized.setPetrolAllowanceMonthlyCap(defaultNumber(payload.getPetrolAllowanceMonthlyCap()));
        sanitized.setTargetDeliveries(defaultNumber(payload.getTargetDeliveries()));
        sanitized.setIncentiveAmount(defaultNumber(payload.getIncentiveAmount()));
        sanitized.setLatePenalty(defaultNumber(payload.getLatePenalty()));
        sanitized.setFailedPenalty(defaultNumber(payload.getFailedPenalty()));
        sanitized.setCodMismatchPenalty(defaultNumber(payload.getCodMismatchPenalty()));
        return sanitized;
    }

    private SalaryConfigPayload defaultSalaryConfig() {
        SalaryConfigPayload salaryConfig = new SalaryConfigPayload();
        salaryConfig.setMonthlyBase(8000);
        salaryConfig.setPerDeliveryRate(20);
        salaryConfig.setPetrolAllowanceMonthlyCap(1500);
        salaryConfig.setTargetDeliveries(220);
        salaryConfig.setIncentiveAmount(1500);
        salaryConfig.setLatePenalty(50);
        salaryConfig.setFailedPenalty(30);
        salaryConfig.setCodMismatchPenalty(100);
        return salaryConfig;
    }

    private Integer defaultNumber(Integer value) {
        return value == null ? 0 : value;
    }

    private String normalizeUpper(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value.trim().toUpperCase();
    }

    private String valueOrFallback(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value.trim();
    }

    @Data
    @NoArgsConstructor
    public static class CreateCourierRequest {
        private String fullName;
        private String phone;
        private String email;
        private String city;
        private String zone;
        private String vehicleNumber;
        private String kycIdNumber;
        private String kycDocUrl;
        private String status;
        private String codSettlementFrequency;
        private SalaryConfigPayload salaryConfig;
    }

    @Data
    @NoArgsConstructor
    public static class SalaryConfigPayload {
        private Integer monthlyBase;
        private Integer perDeliveryRate;
        private Integer petrolAllowanceMonthlyCap;
        private Integer targetDeliveries;
        private Integer incentiveAmount;
        private Integer latePenalty;
        private Integer failedPenalty;
        private Integer codMismatchPenalty;
    }

    @Data
    @NoArgsConstructor
    public static class CourierRecord {
        private Long id;
        private String fullName;
        private String phone;
        private String email;
        private String city;
        private String zone;
        private String status;
        private String kycStatus;
        private String createdAt;
        private Integer activeOrders;
        private Integer deliveriesThisMonth;
        private String codSettlementFrequency;
    }
}
