package com.example.ecommerce.tax.service.impl;

import com.example.ecommerce.modal.HsnMasterRule;

import java.time.LocalDate;
import java.util.List;

final class HsnMasterRuleSupport {
    private static final List<String> SUPPORTED_MAPPING_MODES = List.of("DIRECT", "FIBER_REQUIRED", "RULE_BASED");

    private HsnMasterRuleSupport() {
    }

    static void applyCreateOrUpdate(HsnMasterRule rule, com.example.ecommerce.tax.request.CreateHsnMasterRuleRequest request) {
        rule.setUiCategoryKey(normalizeUiCategoryKey(request.getUiCategoryKey()));
        rule.setDisplayLabel(normalizeDisplayLabel(request.getDisplayLabel()));
        rule.setConstructionType(normalizeUpper(request.getConstructionType(), null));
        rule.setGender(normalizeUpper(request.getGender(), null));
        rule.setFiberFamily(normalizeUpper(request.getFiberFamily(), null));
        rule.setHsnChapter(normalizeUpper(request.getHsnChapter(), null));
        rule.setHsnCode(normalizeUpper(request.getHsnCode(), null));
        rule.setTaxClass(normalizeUpper(request.getTaxClass(), null));
        rule.setMappingMode(normalizeMappingMode(request.getMappingMode()));
        rule.setEffectiveFrom(request.getEffectiveFrom());
        rule.setEffectiveTo(request.getEffectiveTo());
        rule.setApprovalStatus(normalizeApprovalStatus(request.getApprovalStatus()));
        rule.setSourceReference(trimToNull(request.getSourceReference()));
        rule.setNotes(trimToNull(request.getNotes()));
        validateDateRange(rule.getEffectiveFrom(), rule.getEffectiveTo());
    }

    static int scoreRule(HsnMasterRule rule, String constructionType, String gender, String fiberFamily) {
        int score = 0;
        if (isExactMatch(rule.getConstructionType(), constructionType)) {
            score += 30;
        }
        if (isExactMatch(rule.getGender(), gender)) {
            score += 20;
        }
        if (isExactMatch(rule.getFiberFamily(), fiberFamily)) {
            score += 40;
        }
        if (!isWildcard(rule.getConstructionType())) {
            score += 5;
        }
        if (!isWildcard(rule.getGender())) {
            score += 5;
        }
        if (!isWildcard(rule.getFiberFamily())) {
            score += 5;
        }
        return score;
    }

    static boolean matchesDimension(String ruleValue, String requestedValue) {
        if (isWildcard(ruleValue)) {
            return true;
        }
        if (requestedValue == null) {
            return false;
        }
        return requestedValue.equalsIgnoreCase(ruleValue);
    }

    static void validateDateRange(LocalDate effectiveFrom, LocalDate effectiveTo) {
        if (effectiveFrom == null) {
            throw new IllegalArgumentException("Effective from date is required");
        }
        if (effectiveTo != null && effectiveTo.isBefore(effectiveFrom)) {
            throw new IllegalArgumentException("Effective to date cannot be before effective from date");
        }
    }

    static String normalizeDisplayLabel(String displayLabel) {
        String normalized = trimToNull(displayLabel);
        if (normalized == null) {
            throw new IllegalArgumentException("Display label is required");
        }
        return normalized;
    }

    static String normalizeMappingMode(String mappingMode) {
        String normalized = normalizeUpper(mappingMode, "Mapping mode is required");
        if (SUPPORTED_MAPPING_MODES.stream().noneMatch(value -> value.equalsIgnoreCase(normalized))) {
            throw new IllegalArgumentException("Unsupported mapping mode. Allowed values: DIRECT, FIBER_REQUIRED, RULE_BASED");
        }
        return normalized;
    }

    static String normalizeApprovalStatus(String approvalStatus) {
        String normalized = normalizeUpper(approvalStatus, null);
        return normalized == null ? "DRAFT" : normalized;
    }

    static String normalizeUiCategoryKey(String uiCategoryKey) {
        if (uiCategoryKey == null) {
            return null;
        }
        String trimmed = uiCategoryKey.trim().toLowerCase();
        return trimmed.isBlank() ? null : trimmed;
    }

    static String normalizeUpper(String value, String message) {
        String normalized = trimToNull(value);
        if (normalized == null) {
            if (message != null) {
                throw new IllegalArgumentException(message);
            }
            return null;
        }
        return normalized.toUpperCase();
    }

    static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isBlank() ? null : trimmed;
    }

    private static boolean isExactMatch(String ruleValue, String requestedValue) {
        return requestedValue != null && ruleValue != null && requestedValue.equalsIgnoreCase(ruleValue);
    }

    private static boolean isWildcard(String value) {
        if (value == null || value.isBlank()) {
            return true;
        }
        String normalized = value.trim();
        return "ANY".equalsIgnoreCase(normalized) || "*".equals(normalized);
    }
}
