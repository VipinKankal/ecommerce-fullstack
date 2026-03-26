package com.example.ecommerce.tax.service;

import com.example.ecommerce.common.utils.IndianStateCodeResolver;
import com.example.ecommerce.tax.request.ResolveTaxRuleRequest;
import com.example.ecommerce.tax.response.TaxRuleResolutionResponse;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;

@Service
public class TaxComputationSupport {

    private final TaxRuleVersionService taxRuleVersionService;

    public TaxComputationSupport(TaxRuleVersionService taxRuleVersionService) {
        this.taxRuleVersionService = taxRuleVersionService;
    }

    public TaxRuleResolutionResponse resolveGstRule(
            String taxClass,
            String hsnCode,
            Double taxableValue,
            Double sellingPricePerPiece,
            LocalDate effectiveDate
    ) {
        try {
            ResolveTaxRuleRequest request = new ResolveTaxRuleRequest();
            request.setRuleType("GST");
            request.setTaxClass(normalizeUpper(taxClass));
            request.setHsnCode(normalizeUpper(hsnCode));
            request.setTaxableValue(taxableValue == null ? null : roundCurrency(taxableValue));
            request.setSellingPricePerPiece(
                    sellingPricePerPiece == null ? null : roundCurrency(sellingPricePerPiece)
            );
            request.setEffectiveDate(effectiveDate == null ? LocalDate.now() : effectiveDate);
            return taxRuleVersionService.resolveRule(request);
        } catch (IllegalArgumentException exception) {
            return null;
        }
    }

    public TaxRuleResolutionResponse resolveTcsRule(
            Double taxableValue,
            String supplyType,
            LocalDate effectiveDate
    ) {
        if (taxableValue == null || taxableValue <= 0) {
            return null;
        }
        try {
            ResolveTaxRuleRequest request = new ResolveTaxRuleRequest();
            request.setRuleType("TCS");
            request.setTaxClass("MARKETPLACE");
            request.setSupplyType(normalizeUpper(supplyType));
            request.setTaxableValue(roundCurrency(taxableValue));
            request.setEffectiveDate(effectiveDate == null ? LocalDate.now() : effectiveDate);
            return taxRuleVersionService.resolveRule(request);
        } catch (IllegalArgumentException exception) {
            return null;
        }
    }

    public TaxAmounts computeAmounts(String pricingMode, double chargedAmount, double appliedRate) {
        String normalizedPricingMode = normalizePricingMode(pricingMode);
        double safeChargedAmount = Math.max(chargedAmount, 0.0);
        double safeRate = Math.max(appliedRate, 0.0);

        double taxableValue;
        double gstAmount;
        double amountWithTax;
        if ("EXCLUSIVE".equals(normalizedPricingMode)) {
            taxableValue = safeChargedAmount;
            gstAmount = taxableValue * (safeRate / 100.0);
            amountWithTax = safeChargedAmount + gstAmount;
        } else if (safeRate > 0) {
            taxableValue = safeChargedAmount / (1 + (safeRate / 100.0));
            gstAmount = safeChargedAmount - taxableValue;
            amountWithTax = safeChargedAmount;
        } else {
            taxableValue = safeChargedAmount;
            gstAmount = 0.0;
            amountWithTax = safeChargedAmount;
        }

        return new TaxAmounts(
                roundCurrency(taxableValue),
                roundCurrency(gstAmount),
                roundCurrency(amountWithTax)
        );
    }

    public String resolveSellerStateCode(String supplierGstin) {
        if (supplierGstin == null || supplierGstin.length() < 2) {
            return null;
        }
        String prefix = supplierGstin.substring(0, 2);
        return prefix.matches("\\d{2}") ? prefix : null;
    }

    public String resolvePosStateCode(String state) {
        return IndianStateCodeResolver.resolveStateCode(state);
    }

    public String resolveSupplyType(String sellerStateCode, String posStateCode) {
        if (sellerStateCode == null || posStateCode == null) {
            return "UNKNOWN";
        }
        return sellerStateCode.equalsIgnoreCase(posStateCode) ? "INTRA_STATE" : "INTER_STATE";
    }

    public double roundCurrency(double value) {
        return BigDecimal.valueOf(value)
                .setScale(2, RoundingMode.HALF_UP)
                .doubleValue();
    }

    public String normalizePricingMode(String pricingMode) {
        if (pricingMode == null || pricingMode.isBlank()) {
            return "INCLUSIVE";
        }
        String normalized = pricingMode.trim().toUpperCase();
        return "EXCLUSIVE".equals(normalized) ? "EXCLUSIVE" : "INCLUSIVE";
    }

    public String normalizeUpper(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isBlank() ? null : trimmed.toUpperCase();
    }

    public record TaxAmounts(
            Double taxableValue,
            Double gstAmount,
            Double amountWithTax
    ) {
    }
}
