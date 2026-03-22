package com.example.ecommerce.admin.controller;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.YearMonth;
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
    private static final AtomicLong OPS_SEQUENCE = new AtomicLong(5000);
    private static final Map<Long, CourierRecord> COURIER_STORE = new ConcurrentHashMap<>();
    private static final Map<Long, SalaryConfigPayload> SALARY_STORE = new ConcurrentHashMap<>();
    private static final Map<Long, CodSettlementRecord> COD_SETTLEMENT_STORE = new ConcurrentHashMap<>();
    private static final Map<Long, PetrolClaimRecord> PETROL_CLAIM_STORE = new ConcurrentHashMap<>();
    private static final Map<String, PayrollRowRecord> PAYROLL_STORE = new ConcurrentHashMap<>();

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

        SalaryConfigPayload salaryConfig = sanitizeSalary(request.getSalaryConfig());
        SALARY_STORE.put(courierId, salaryConfig);
        seedOpsRecordsForCourier(courier);
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
        PayrollRowRecord payrollRow = getOrCreatePayrollRow(id, resolveMonth(month));

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("month", payrollRow.getMonth());
        response.put("monthlyBase", salaryConfig.getMonthlyBase());
        response.put("perDeliveryRate", salaryConfig.getPerDeliveryRate());
        response.put("petrolAllowanceMonthlyCap", salaryConfig.getPetrolAllowanceMonthlyCap());
        response.put("targetDeliveries", salaryConfig.getTargetDeliveries());
        response.put("incentiveAmount", salaryConfig.getIncentiveAmount());
        response.put("latePenalty", salaryConfig.getLatePenalty());
        response.put("failedPenalty", salaryConfig.getFailedPenalty());
        response.put("codMismatchPenalty", salaryConfig.getCodMismatchPenalty());
        response.put("baseSalary", payrollRow.getBaseSalary());
        response.put("presentDays", payrollRow.getPresentDays());
        response.put("payableDays", payrollRow.getPayableDays());
        response.put("deliveriesCount", payrollRow.getDeliveriesCount() == null ? courier.getDeliveriesThisMonth() : payrollRow.getDeliveriesCount());
        response.put("perDeliveryEarnings", payrollRow.getPerDeliveryEarnings());
        response.put("petrolAllowanceApproved", payrollRow.getPetrolAllowanceApproved());
        response.put("incentiveAmount", payrollRow.getIncentiveAmount());
        response.put("penalties", payrollRow.getPenalties());
        response.put("totalPayable", payrollRow.getTotalPayable());
        response.put("payoutStatus", payrollRow.getPayoutStatus());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/cod-settlements")
    public ResponseEntity<List<CodSettlementRecord>> getCodSettlements(
            @RequestParam(required = false) String status
    ) {
        String normalizedStatus = normalizeUpper(status, "");
        return ResponseEntity.ok(
                COD_SETTLEMENT_STORE.values().stream()
                        .filter(record -> normalizedStatus.isBlank() || normalizedStatus.equals(normalizeUpper(record.getStatus(), "")))
                        .sorted(Comparator.comparing(CodSettlementRecord::getId))
                        .toList()
        );
    }

    @PatchMapping("/cod-settlements/{id}")
    public ResponseEntity<CodSettlementRecord> updateCodSettlement(
            @PathVariable Long id,
            @RequestBody ReviewStatusPayload payload
    ) throws Exception {
        CodSettlementRecord record = getCodSettlement(id);
        String nextStatus = normalizeUpper(payload == null ? null : payload.getStatus(), record.getStatus());
        record.setStatus(nextStatus);
        if ("VERIFIED".equals(nextStatus) || "APPROVED".equals(nextStatus)) {
            record.setDepositDate(LocalDateTime.now().toLocalDate().toString());
        }
        return ResponseEntity.ok(record);
    }

    @GetMapping("/petrol-claims")
    public ResponseEntity<List<PetrolClaimRecord>> getPetrolClaims(
            @RequestParam(required = false) String status
    ) {
        String normalizedStatus = normalizeUpper(status, "");
        return ResponseEntity.ok(
                PETROL_CLAIM_STORE.values().stream()
                        .filter(record -> normalizedStatus.isBlank() || normalizedStatus.equals(normalizeUpper(record.getStatus(), "")))
                        .sorted(Comparator.comparing(PetrolClaimRecord::getId))
                        .toList()
        );
    }

    @PatchMapping("/petrol-claims/{id}")
    public ResponseEntity<PetrolClaimRecord> updatePetrolClaim(
            @PathVariable Long id,
            @RequestBody PetrolClaimReviewPayload payload
    ) throws Exception {
        PetrolClaimRecord record = getPetrolClaim(id);
        record.setStatus(normalizeUpper(payload == null ? null : payload.getStatus(), record.getStatus()));
        if (payload != null && payload.getReviewerNote() != null && !payload.getReviewerNote().isBlank()) {
            record.setNotes(payload.getReviewerNote().trim());
        }
        return ResponseEntity.ok(record);
    }

    @GetMapping("/payroll")
    public ResponseEntity<List<PayrollRowRecord>> getPayrollRows(
            @RequestParam(required = false) String month
    ) {
        String resolvedMonth = resolveMonth(month);
        return ResponseEntity.ok(
                PAYROLL_STORE.values().stream()
                        .filter(record -> resolvedMonth.equals(record.getMonth()))
                        .sorted(Comparator.comparing(PayrollRowRecord::getCourierName, String.CASE_INSENSITIVE_ORDER))
                        .toList()
        );
    }

    @PostMapping("/payroll/run")
    public ResponseEntity<List<PayrollRowRecord>> runPayroll(
            @RequestBody(required = false) PayrollRunRequest payload
    ) {
        String resolvedMonth = resolveMonth(payload == null ? null : payload.getMonth());
        COURIER_STORE.values().forEach(courier -> getOrCreatePayrollRow(courier.getId(), resolvedMonth));
        return ResponseEntity.ok(
                PAYROLL_STORE.values().stream()
                        .filter(record -> resolvedMonth.equals(record.getMonth()))
                        .sorted(Comparator.comparing(PayrollRowRecord::getCourierName, String.CASE_INSENSITIVE_ORDER))
                        .toList()
        );
    }

    @PostMapping("/payroll/{courierId}/lock")
    public ResponseEntity<PayrollRowRecord> lockPayroll(
            @PathVariable Long courierId,
            @RequestBody(required = false) MonthPayload payload
    ) throws Exception {
        String resolvedMonth = resolveMonth(payload == null ? null : payload.getMonth());
        getCourier(courierId);
        PayrollRowRecord row = getOrCreatePayrollRow(courierId, resolvedMonth);
        row.setPayoutStatus("LOCKED");
        return ResponseEntity.ok(row);
    }

    @PostMapping("/payouts")
    public ResponseEntity<PayrollRowRecord> markPayout(
            @RequestBody PayoutRequest payload
    ) throws Exception {
        if (payload == null || payload.getCourierId() == null) {
            throw new Exception("Courier id is required");
        }
        String resolvedMonth = resolveMonth(payload.getMonth());
        getCourier(payload.getCourierId());
        PayrollRowRecord row = getOrCreatePayrollRow(payload.getCourierId(), resolvedMonth);
        row.setPayoutStatus("PAID");
        row.setPaidAt(LocalDateTime.now().toString());
        row.setPayoutReference(valueOrFallback(payload.getReferenceNumber(), "PAYOUT-" + row.getCourierId() + "-" + row.getMonth()));
        return ResponseEntity.ok(row);
    }

    private CourierRecord getCourier(Long id) throws Exception {
        CourierRecord courier = COURIER_STORE.get(id);
        if (courier == null) {
            throw new Exception("Courier not found");
        }
        return courier;
    }

    private CodSettlementRecord getCodSettlement(Long id) throws Exception {
        CodSettlementRecord record = COD_SETTLEMENT_STORE.get(id);
        if (record == null) {
            throw new Exception("COD settlement not found");
        }
        return record;
    }

    private PetrolClaimRecord getPetrolClaim(Long id) throws Exception {
        PetrolClaimRecord record = PETROL_CLAIM_STORE.get(id);
        if (record == null) {
            throw new Exception("Petrol claim not found");
        }
        return record;
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

    private String resolveMonth(String month) {
        if (month == null || month.isBlank()) {
            return YearMonth.now().toString();
        }
        return month.trim();
    }

    private PayrollRowRecord getOrCreatePayrollRow(Long courierId, String month) {
        String key = courierId + ":" + month;
        PayrollRowRecord existing = PAYROLL_STORE.get(key);
        if (existing != null) {
            return existing;
        }

        CourierRecord courier = COURIER_STORE.get(courierId);
        SalaryConfigPayload salaryConfig = SALARY_STORE.getOrDefault(courierId, defaultSalaryConfig());
        int deliveries = courier == null || courier.getDeliveriesThisMonth() == null ? 0 : courier.getDeliveriesThisMonth();
        int perDeliveryRate = salaryConfig.getPerDeliveryRate() == null ? 0 : salaryConfig.getPerDeliveryRate();
        int perDeliveryEarnings = deliveries * perDeliveryRate;
        int petrolApproved = Math.min(
                salaryConfig.getPetrolAllowanceMonthlyCap() == null ? 0 : salaryConfig.getPetrolAllowanceMonthlyCap(),
                1000
        );
        int baseSalary = salaryConfig.getMonthlyBase() == null ? 0 : salaryConfig.getMonthlyBase();
        int incentives = salaryConfig.getIncentiveAmount() == null ? 0 : salaryConfig.getIncentiveAmount();
        int totalPayable = baseSalary + perDeliveryEarnings + petrolApproved + incentives;

        PayrollRowRecord row = new PayrollRowRecord();
        row.setId((long) (Math.abs(key.hashCode()) + 1));
        row.setCourierId(courierId);
        row.setCourierName(courier == null ? "Courier" : courier.getFullName());
        row.setMonth(month);
        row.setBaseSalary(baseSalary);
        row.setPresentDays(26);
        row.setPayableDays(26);
        row.setPerDeliveryEarnings(perDeliveryEarnings);
        row.setPetrolAllowanceApproved(petrolApproved);
        row.setIncentiveAmount(incentives);
        row.setPenalties(0);
        row.setTotalPayable(totalPayable);
        row.setPayoutStatus("DRAFT");
        row.setDeliveriesCount(deliveries);
        PAYROLL_STORE.put(key, row);
        return row;
    }

    private void seedOpsRecordsForCourier(CourierRecord courier) {
        long codId = OPS_SEQUENCE.incrementAndGet();
        CodSettlementRecord codSettlement = new CodSettlementRecord();
        codSettlement.setId(codId);
        codSettlement.setOrderId(codId + 10000);
        codSettlement.setCourierId(courier.getId());
        codSettlement.setCourierName(courier.getFullName());
        codSettlement.setAmount(0);
        codSettlement.setPaymentMode("CASH");
        codSettlement.setCollectedAt(LocalDateTime.now().minusDays(1).toString());
        codSettlement.setStatus("PENDING_DEPOSIT");
        codSettlement.setTransactionId("COD-" + codId);
        COD_SETTLEMENT_STORE.put(codId, codSettlement);

        long petrolId = OPS_SEQUENCE.incrementAndGet();
        PetrolClaimRecord petrolClaim = new PetrolClaimRecord();
        petrolClaim.setId(petrolId);
        petrolClaim.setCourierId(courier.getId());
        petrolClaim.setCourierName(courier.getFullName());
        petrolClaim.setMonth(YearMonth.now().toString());
        petrolClaim.setAmount(0);
        petrolClaim.setStatus("PENDING");
        petrolClaim.setNotes("Awaiting review");
        PETROL_CLAIM_STORE.put(petrolId, petrolClaim);
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
    public static class ReviewStatusPayload {
        private String status;
    }

    @Data
    @NoArgsConstructor
    public static class PetrolClaimReviewPayload {
        private String status;
        private String reviewerNote;
    }

    @Data
    @NoArgsConstructor
    public static class PayrollRunRequest {
        private String month;
    }

    @Data
    @NoArgsConstructor
    public static class MonthPayload {
        private String month;
    }

    @Data
    @NoArgsConstructor
    public static class PayoutRequest {
        private Long courierId;
        private String month;
        private String payoutMode;
        private String referenceNumber;
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

    @Data
    @NoArgsConstructor
    public static class CodSettlementRecord {
        private Long id;
        private Long orderId;
        private Long courierId;
        private String courierName;
        private Integer amount;
        private String paymentMode;
        private String collectedAt;
        private String status;
        private String depositDate;
        private String transactionId;
    }

    @Data
    @NoArgsConstructor
    public static class PetrolClaimRecord {
        private Long id;
        private Long courierId;
        private String courierName;
        private String month;
        private Integer amount;
        private String status;
        private String receiptUrl;
        private String notes;
    }

    @Data
    @NoArgsConstructor
    public static class PayrollRowRecord {
        private Long id;
        private Long courierId;
        private String courierName;
        private String month;
        private Integer baseSalary;
        private Integer presentDays;
        private Integer payableDays;
        private Integer deliveriesCount;
        private Integer perDeliveryEarnings;
        private Integer petrolAllowanceApproved;
        private Integer incentiveAmount;
        private Integer penalties;
        private Integer totalPayable;
        private String payoutStatus;
        private String paidAt;
        private String payoutReference;
    }
}
