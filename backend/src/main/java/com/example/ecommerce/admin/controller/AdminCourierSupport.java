package com.example.ecommerce.admin.controller;

import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.LinkedHashMap;
import java.util.Map;

final class AdminCourierSupport {
    private static final int DEFAULT_MONTHLY_BASE = 8000;
    private static final int DEFAULT_PER_DELIVERY_RATE = 20;
    private static final int DEFAULT_PETROL_CAP = 1500;
    private static final int DEFAULT_TARGET_DELIVERIES = 220;
    private static final int DEFAULT_INCENTIVE_AMOUNT = 1500;
    private static final int DEFAULT_LATE_PENALTY = 50;
    private static final int DEFAULT_FAILED_PENALTY = 30;
    private static final int DEFAULT_COD_MISMATCH_PENALTY = 100;

    private AdminCourierSupport() {
    }

    static CourierRecord createCourierRecord(long courierId, CreateCourierRequest request) {
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
        return courier;
    }

    static SalaryConfigPayload sanitizeSalary(SalaryConfigPayload payload) {
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

    static SalaryConfigPayload defaultSalaryConfig() {
        SalaryConfigPayload salaryConfig = new SalaryConfigPayload();
        salaryConfig.setMonthlyBase(DEFAULT_MONTHLY_BASE);
        salaryConfig.setPerDeliveryRate(DEFAULT_PER_DELIVERY_RATE);
        salaryConfig.setPetrolAllowanceMonthlyCap(DEFAULT_PETROL_CAP);
        salaryConfig.setTargetDeliveries(DEFAULT_TARGET_DELIVERIES);
        salaryConfig.setIncentiveAmount(DEFAULT_INCENTIVE_AMOUNT);
        salaryConfig.setLatePenalty(DEFAULT_LATE_PENALTY);
        salaryConfig.setFailedPenalty(DEFAULT_FAILED_PENALTY);
        salaryConfig.setCodMismatchPenalty(DEFAULT_COD_MISMATCH_PENALTY);
        return salaryConfig;
    }

    static Map<String, Object> buildEarningsResponse(CourierRecord courier, SalaryConfigPayload salaryConfig, PayrollRowRecord payrollRow) {
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
        return response;
    }

    static PayrollRowRecord buildPayrollRow(Long courierId, String month, CourierRecord courier, SalaryConfigPayload salaryConfig) {
        int deliveries = courier == null || courier.getDeliveriesThisMonth() == null ? 0 : courier.getDeliveriesThisMonth();
        int perDeliveryRate = salaryConfig.getPerDeliveryRate() == null ? 0 : salaryConfig.getPerDeliveryRate();
        int perDeliveryEarnings = deliveries * perDeliveryRate;
        int petrolApproved = Math.min(salaryConfig.getPetrolAllowanceMonthlyCap() == null ? 0 : salaryConfig.getPetrolAllowanceMonthlyCap(), 1000);
        int baseSalary = salaryConfig.getMonthlyBase() == null ? 0 : salaryConfig.getMonthlyBase();
        int incentives = salaryConfig.getIncentiveAmount() == null ? 0 : salaryConfig.getIncentiveAmount();
        int totalPayable = baseSalary + perDeliveryEarnings + petrolApproved + incentives;
        String key = courierId + ":" + month;

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
        return row;
    }

    static CodSettlementRecord createCodSettlement(long opsId, CourierRecord courier) {
        CodSettlementRecord codSettlement = new CodSettlementRecord();
        codSettlement.setId(opsId);
        codSettlement.setOrderId(opsId + 10000);
        codSettlement.setCourierId(courier.getId());
        codSettlement.setCourierName(courier.getFullName());
        codSettlement.setAmount(0);
        codSettlement.setPaymentMode("CASH");
        codSettlement.setCollectedAt(LocalDateTime.now().minusDays(1).toString());
        codSettlement.setStatus("PENDING_DEPOSIT");
        codSettlement.setTransactionId("COD-" + opsId);
        return codSettlement;
    }

    static PetrolClaimRecord createPetrolClaim(long opsId, CourierRecord courier) {
        PetrolClaimRecord petrolClaim = new PetrolClaimRecord();
        petrolClaim.setId(opsId);
        petrolClaim.setCourierId(courier.getId());
        petrolClaim.setCourierName(courier.getFullName());
        petrolClaim.setMonth(YearMonth.now().toString());
        petrolClaim.setAmount(0);
        petrolClaim.setStatus("PENDING");
        petrolClaim.setNotes("Awaiting review");
        return petrolClaim;
    }

    static String resolveMonth(String month) {
        if (month == null || month.isBlank()) {
            return YearMonth.now().toString();
        }
        return month.trim();
    }

    static String normalizeUpper(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value.trim().toUpperCase();
    }

    static String valueOrFallback(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value.trim();
    }

    private static Integer defaultNumber(Integer value) {
        return value == null ? 0 : value;
    }
}
