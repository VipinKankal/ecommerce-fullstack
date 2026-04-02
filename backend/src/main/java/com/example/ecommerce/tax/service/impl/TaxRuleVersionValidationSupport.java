package com.example.ecommerce.tax.service.impl;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;

final class TaxRuleVersionValidationSupport {

    static final List<String> SUPPORTED_RULE_TYPES = List.of("GST", "TCS");
    static final List<String> SUPPORTED_VALUE_BASIS = List.of("TAXABLE_VALUE", "SELLING_PRICE_PER_PIECE");
    static final List<String> SUPPORTED_APPROVAL_STATUSES = List.of("DRAFT", "CA_APPROVED", "REJECTED");

    private TaxRuleVersionValidationSupport() {
    }

    static void validateDateRange(LocalDate effectiveFrom, LocalDate effectiveTo) {
        if (effectiveFrom == null) {
            throw new IllegalArgumentException("Effective from date is required");
        }
        if (effectiveTo != null && effectiveTo.isBefore(effectiveFrom)) {
            throw new IllegalArgumentException("Effective to date cannot be before effective from date");
        }
    }

    static void validateTaxableRange(Double minTaxableValue, Double maxTaxableValue) {
        if (minTaxableValue != null && minTaxableValue < 0) {
            throw new IllegalArgumentException("Minimum taxable value cannot be negative");
        }
        if (maxTaxableValue != null && maxTaxableValue < 0) {
            throw new IllegalArgumentException("Maximum taxable value cannot be negative");
        }
        if (minTaxableValue != null && maxTaxableValue != null && minTaxableValue > maxTaxableValue) {
            throw new IllegalArgumentException("Minimum taxable value cannot be greater than maximum taxable value");
        }
    }

    static void validateRate(Double ratePercentage) {
        if (ratePercentage == null) {
            throw new IllegalArgumentException("Rate percentage is required");
        }
        if (ratePercentage < 0 || ratePercentage > 100) {
            throw new IllegalArgumentException("Rate percentage must be between 0 and 100");
        }
    }

    static String normalizeRuleType(String ruleType) {
        String normalized = normalizeRequired(ruleType, "Rule type is required");
        if (SUPPORTED_RULE_TYPES.stream().noneMatch(type -> type.equalsIgnoreCase(normalized))) {
            throw new IllegalArgumentException("Unsupported rule type. Allowed values: GST, TCS");
        }
        return normalized;
    }

    static String normalizeValueBasis(String valueBasis) {
        String normalized = normalizeNullable(valueBasis);
        if (normalized == null) {
            return "TAXABLE_VALUE";
        }
        if (SUPPORTED_VALUE_BASIS.stream().noneMatch(value -> value.equalsIgnoreCase(normalized))) {
            throw new IllegalArgumentException("Unsupported value basis. Allowed values: TAXABLE_VALUE, SELLING_PRICE_PER_PIECE");
        }
        return normalized;
    }

    static String normalizeApprovalStatus(String approvalStatus) {
        String normalized = normalizeNullable(approvalStatus);
        if (normalized == null) {
            return "DRAFT";
        }
        if (SUPPORTED_APPROVAL_STATUSES.stream().noneMatch(value -> value.equalsIgnoreCase(normalized))) {
            throw new IllegalArgumentException("Unsupported approval status. Allowed values: DRAFT, CA_APPROVED, REJECTED");
        }
        return normalized;
    }

    static String normalizeRequired(String value, String message) {
        String normalized = normalizeNullable(value);
        if (normalized == null) {
            throw new IllegalArgumentException(message);
        }
        return normalized;
    }

    static String normalizeNullable(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        if (trimmed.isBlank()) {
            return null;
        }
        return trimmed.toUpperCase();
    }

    static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isBlank() ? null : trimmed;
    }

    static double roundRate(Double value) {
        return BigDecimal.valueOf(value).setScale(4, RoundingMode.HALF_UP).doubleValue();
    }

    static double roundCurrency(Double value) {
        return BigDecimal.valueOf(value).setScale(2, RoundingMode.HALF_UP).doubleValue();
    }
}
