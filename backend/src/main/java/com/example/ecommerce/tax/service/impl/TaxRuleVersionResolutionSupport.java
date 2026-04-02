package com.example.ecommerce.tax.service.impl;

import com.example.ecommerce.modal.TaxRuleVersion;

final class TaxRuleVersionResolutionSupport {

    private TaxRuleVersionResolutionSupport() {
    }

    static int scoreRule(
            TaxRuleVersion rule,
            String requestedTaxClass,
            String requestedHsnCode,
            String requestedSupplyType,
            Double taxableValue,
            Double sellingPricePerPiece
    ) {
        int score = 0;
        if (isExactMatch(rule.getTaxClass(), requestedTaxClass)) {
            score += 30;
        }
        if (isExactMatch(rule.getHsnCode(), requestedHsnCode)) {
            score += 25;
        }
        if (isExactMatch(rule.getSupplyType(), requestedSupplyType)) {
            score += 25;
        }
        if (resolveComparisonValue(rule, taxableValue, sellingPricePerPiece) > 0
                && (rule.getMinTaxableValue() != null || rule.getMaxTaxableValue() != null)) {
            score += 20;
        }
        if (!isWildcard(rule.getTaxClass())) {
            score += 5;
        }
        if (!isWildcard(rule.getHsnCode())) {
            score += 5;
        }
        if (!isWildcard(rule.getSupplyType())) {
            score += 5;
        }
        return score;
    }

    static boolean matchesComparisonRange(
            TaxRuleVersion rule,
            Double taxableValue,
            Double sellingPricePerPiece
    ) {
        Double comparisonValue = resolveNullableComparisonValue(rule, taxableValue, sellingPricePerPiece);
        if (comparisonValue == null) {
            return rule.getMinTaxableValue() == null && rule.getMaxTaxableValue() == null;
        }
        if (rule.getMinTaxableValue() != null && comparisonValue < rule.getMinTaxableValue()) {
            return false;
        }
        if (rule.getMaxTaxableValue() != null && comparisonValue > rule.getMaxTaxableValue()) {
            return false;
        }
        return true;
    }

    static boolean matchesRuleDimension(String ruleValue, String requestedValue) {
        if (isWildcard(ruleValue)) {
            return true;
        }
        if (requestedValue == null) {
            return false;
        }
        return requestedValue.equalsIgnoreCase(ruleValue);
    }

    static double resolveComparisonValue(
            TaxRuleVersion rule,
            Double taxableValue,
            Double sellingPricePerPiece
    ) {
        Double value = resolveNullableComparisonValue(rule, taxableValue, sellingPricePerPiece);
        return value == null ? 0.0 : value;
    }

    private static Double resolveNullableComparisonValue(
            TaxRuleVersion rule,
            Double taxableValue,
            Double sellingPricePerPiece
    ) {
        String valueBasis = TaxRuleVersionValidationSupport.normalizeValueBasis(rule.getValueBasis());
        if ("SELLING_PRICE_PER_PIECE".equalsIgnoreCase(valueBasis)) {
            return sellingPricePerPiece;
        }
        return taxableValue;
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
