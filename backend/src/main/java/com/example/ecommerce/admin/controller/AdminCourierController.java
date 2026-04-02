package com.example.ecommerce.admin.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Comparator;
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
        return ResponseEntity.ok(COURIER_STORE.values().stream().sorted(Comparator.comparing(CourierRecord::getId)).toList());
    }

    @PostMapping
    public ResponseEntity<CourierRecord> createCourier(@RequestBody CreateCourierRequest request) {
        long courierId = ID_SEQUENCE.incrementAndGet();
        CourierRecord courier = AdminCourierSupport.createCourierRecord(courierId, request);
        COURIER_STORE.put(courierId, courier);
        SALARY_STORE.put(courierId, AdminCourierSupport.sanitizeSalary(request.getSalaryConfig()));
        seedOpsRecordsForCourier(courier);
        return new ResponseEntity<>(courier, HttpStatus.CREATED);
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<CourierRecord> updateStatus(@PathVariable Long id, @RequestParam String status) throws Exception {
        CourierRecord courier = getCourier(id);
        courier.setStatus(AdminCourierSupport.normalizeUpper(status, courier.getStatus()));
        return ResponseEntity.ok(courier);
    }

    @PatchMapping("/{id}/cod-frequency")
    public ResponseEntity<CourierRecord> updateCodFrequency(@PathVariable Long id, @RequestBody Map<String, String> payload) throws Exception {
        CourierRecord courier = getCourier(id);
        courier.setCodSettlementFrequency(AdminCourierSupport.normalizeUpper(payload == null ? null : payload.get("frequency"), courier.getCodSettlementFrequency()));
        return ResponseEntity.ok(courier);
    }

    @PutMapping("/{id}/salary")
    public ResponseEntity<SalaryConfigPayload> updateSalary(@PathVariable Long id, @RequestBody SalaryConfigPayload payload) throws Exception {
        getCourier(id);
        SalaryConfigPayload sanitized = AdminCourierSupport.sanitizeSalary(payload);
        SALARY_STORE.put(id, sanitized);
        return ResponseEntity.ok(sanitized);
    }

    @GetMapping("/{id}/earnings")
    public ResponseEntity<Map<String, Object>> getCourierEarnings(@PathVariable Long id, @RequestParam(required = false) String month) throws Exception {
        CourierRecord courier = getCourier(id);
        SalaryConfigPayload salaryConfig = SALARY_STORE.getOrDefault(id, AdminCourierSupport.defaultSalaryConfig());
        PayrollRowRecord payrollRow = getOrCreatePayrollRow(id, AdminCourierSupport.resolveMonth(month));
        return ResponseEntity.ok(AdminCourierSupport.buildEarningsResponse(courier, salaryConfig, payrollRow));
    }

    @GetMapping("/cod-settlements")
    public ResponseEntity<List<CodSettlementRecord>> getCodSettlements(@RequestParam(required = false) String status) {
        String normalizedStatus = AdminCourierSupport.normalizeUpper(status, "");
        return ResponseEntity.ok(COD_SETTLEMENT_STORE.values().stream().filter(record -> normalizedStatus.isBlank() || normalizedStatus.equals(AdminCourierSupport.normalizeUpper(record.getStatus(), ""))).sorted(Comparator.comparing(CodSettlementRecord::getId)).toList());
    }

    @PatchMapping("/cod-settlements/{id}")
    public ResponseEntity<CodSettlementRecord> updateCodSettlement(@PathVariable Long id, @RequestBody ReviewStatusPayload payload) throws Exception {
        CodSettlementRecord record = getCodSettlement(id);
        String nextStatus = AdminCourierSupport.normalizeUpper(payload == null ? null : payload.getStatus(), record.getStatus());
        record.setStatus(nextStatus);
        if ("VERIFIED".equals(nextStatus) || "APPROVED".equals(nextStatus)) {
            record.setDepositDate(LocalDateTime.now().toLocalDate().toString());
        }
        return ResponseEntity.ok(record);
    }

    @GetMapping("/petrol-claims")
    public ResponseEntity<List<PetrolClaimRecord>> getPetrolClaims(@RequestParam(required = false) String status) {
        String normalizedStatus = AdminCourierSupport.normalizeUpper(status, "");
        return ResponseEntity.ok(PETROL_CLAIM_STORE.values().stream().filter(record -> normalizedStatus.isBlank() || normalizedStatus.equals(AdminCourierSupport.normalizeUpper(record.getStatus(), ""))).sorted(Comparator.comparing(PetrolClaimRecord::getId)).toList());
    }

    @PatchMapping("/petrol-claims/{id}")
    public ResponseEntity<PetrolClaimRecord> updatePetrolClaim(@PathVariable Long id, @RequestBody PetrolClaimReviewPayload payload) throws Exception {
        PetrolClaimRecord record = getPetrolClaim(id);
        record.setStatus(AdminCourierSupport.normalizeUpper(payload == null ? null : payload.getStatus(), record.getStatus()));
        if (payload != null && payload.getReviewerNote() != null && !payload.getReviewerNote().isBlank()) {
            record.setNotes(payload.getReviewerNote().trim());
        }
        return ResponseEntity.ok(record);
    }

    @GetMapping("/payroll")
    public ResponseEntity<List<PayrollRowRecord>> getPayrollRows(@RequestParam(required = false) String month) {
        String resolvedMonth = AdminCourierSupport.resolveMonth(month);
        return ResponseEntity.ok(PAYROLL_STORE.values().stream().filter(record -> resolvedMonth.equals(record.getMonth())).sorted(Comparator.comparing(PayrollRowRecord::getCourierName, String.CASE_INSENSITIVE_ORDER)).toList());
    }

    @PostMapping("/payroll/run")
    public ResponseEntity<List<PayrollRowRecord>> runPayroll(@RequestBody(required = false) PayrollRunRequest payload) {
        String resolvedMonth = AdminCourierSupport.resolveMonth(payload == null ? null : payload.getMonth());
        COURIER_STORE.values().forEach(courier -> getOrCreatePayrollRow(courier.getId(), resolvedMonth));
        return ResponseEntity.ok(PAYROLL_STORE.values().stream().filter(record -> resolvedMonth.equals(record.getMonth())).sorted(Comparator.comparing(PayrollRowRecord::getCourierName, String.CASE_INSENSITIVE_ORDER)).toList());
    }

    @PostMapping("/payroll/{courierId}/lock")
    public ResponseEntity<PayrollRowRecord> lockPayroll(@PathVariable Long courierId, @RequestBody(required = false) MonthPayload payload) throws Exception {
        String resolvedMonth = AdminCourierSupport.resolveMonth(payload == null ? null : payload.getMonth());
        getCourier(courierId);
        PayrollRowRecord row = getOrCreatePayrollRow(courierId, resolvedMonth);
        row.setPayoutStatus("LOCKED");
        return ResponseEntity.ok(row);
    }

    @PostMapping("/payouts")
    public ResponseEntity<PayrollRowRecord> markPayout(@RequestBody PayoutRequest payload) throws Exception {
        if (payload == null || payload.getCourierId() == null) {
            throw new Exception("Courier id is required");
        }
        String resolvedMonth = AdminCourierSupport.resolveMonth(payload.getMonth());
        getCourier(payload.getCourierId());
        PayrollRowRecord row = getOrCreatePayrollRow(payload.getCourierId(), resolvedMonth);
        row.setPayoutStatus("PAID");
        row.setPaidAt(LocalDateTime.now().toString());
        row.setPayoutReference(AdminCourierSupport.valueOrFallback(payload.getReferenceNumber(), "PAYOUT-" + row.getCourierId() + "-" + row.getMonth()));
        return ResponseEntity.ok(row);
    }

    private CourierRecord getCourier(Long id) throws Exception {
        CourierRecord courier = COURIER_STORE.get(id);
        if (courier == null) throw new Exception("Courier not found");
        return courier;
    }

    private CodSettlementRecord getCodSettlement(Long id) throws Exception {
        CodSettlementRecord record = COD_SETTLEMENT_STORE.get(id);
        if (record == null) throw new Exception("COD settlement not found");
        return record;
    }

    private PetrolClaimRecord getPetrolClaim(Long id) throws Exception {
        PetrolClaimRecord record = PETROL_CLAIM_STORE.get(id);
        if (record == null) throw new Exception("Petrol claim not found");
        return record;
    }

    private PayrollRowRecord getOrCreatePayrollRow(Long courierId, String month) {
        String key = courierId + ":" + month;
        PayrollRowRecord existing = PAYROLL_STORE.get(key);
        if (existing != null) return existing;
        PayrollRowRecord row = AdminCourierSupport.buildPayrollRow(courierId, month, COURIER_STORE.get(courierId), SALARY_STORE.getOrDefault(courierId, AdminCourierSupport.defaultSalaryConfig()));
        PAYROLL_STORE.put(key, row);
        return row;
    }

    private void seedOpsRecordsForCourier(CourierRecord courier) {
        long codId = OPS_SEQUENCE.incrementAndGet();
        COD_SETTLEMENT_STORE.put(codId, AdminCourierSupport.createCodSettlement(codId, courier));
        long petrolId = OPS_SEQUENCE.incrementAndGet();
        PETROL_CLAIM_STORE.put(petrolId, AdminCourierSupport.createPetrolClaim(petrolId, courier));
    }
}
