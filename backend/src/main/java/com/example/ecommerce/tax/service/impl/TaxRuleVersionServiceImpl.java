package com.example.ecommerce.tax.service.impl;

import com.example.ecommerce.modal.TaxRuleVersion;
import com.example.ecommerce.repository.TaxRuleVersionRepository;
import com.example.ecommerce.tax.request.CreateTaxRuleVersionRequest;
import com.example.ecommerce.tax.request.ResolveTaxRuleRequest;
import com.example.ecommerce.tax.response.TaxRuleResolutionResponse;
import com.example.ecommerce.tax.response.TaxRuleVersionResponse;
import com.example.ecommerce.tax.service.TaxRuleVersionService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TaxRuleVersionServiceImpl implements TaxRuleVersionService {

    private static final List<String> SUPPORTED_RULE_TYPES = List.of("GST", "TCS");
    private static final List<String> SUPPORTED_VALUE_BASIS = List.of(
            "TAXABLE_VALUE",
            "SELLING_PRICE_PER_PIECE"
    );
    private static final List<String> SUPPORTED_APPROVAL_STATUSES = List.of(
            "DRAFT",
            "CA_APPROVED",
            "REJECTED"
    );

    private final TaxRuleVersionRepository taxRuleVersionRepository;

    @Value("${app.tax.production-approved-only:true}")
    private boolean productionApprovedOnly;

    @Override
    @Transactional
    public TaxRuleVersionResponse createRule(CreateTaxRuleVersionRequest request) {
        String normalizedRuleCode = normalizeRequired(request.getRuleCode(), "Rule code is required");
        String normalizedRuleType = normalizeRuleType(request.getRuleType());

        if (taxRuleVersionRepository.findByRuleCodeIgnoreCase(normalizedRuleCode).isPresent()) {
            throw new IllegalArgumentException("Tax rule code already exists");
        }

        validateDateRange(request.getEffectiveFrom(), request.getEffectiveTo());
        validateTaxableRange(request.getMinTaxableValue(), request.getMaxTaxableValue());
        validateRate(request.getRatePercentage());

        TaxRuleVersion rule = new TaxRuleVersion();
        rule.setRuleCode(normalizedRuleCode);
        rule.setRuleType(normalizedRuleType);
        rule.setTaxClass(normalizeNullable(request.getTaxClass()));
        rule.setHsnCode(normalizeNullable(request.getHsnCode()));
        rule.setSupplyType(normalizeNullable(request.getSupplyType()));
        rule.setValueBasis(normalizeValueBasis(request.getValueBasis()));
        rule.setMinTaxableValue(request.getMinTaxableValue());
        rule.setMaxTaxableValue(request.getMaxTaxableValue());
        rule.setRatePercentage(roundRate(request.getRatePercentage()));
        rule.setEffectiveFrom(request.getEffectiveFrom());
        rule.setEffectiveTo(request.getEffectiveTo());
        rule.setSourceReference(trimToNull(request.getSourceReference()));
        rule.setNotes(trimToNull(request.getNotes()));
        rule.setApprovalStatus(normalizeApprovalStatus(request.getApprovalStatus()));
        rule.setApprovedAt(request.getApprovedAt() == null ? null : request.getApprovedAt().atStartOfDay());
        rule.setApprovedBy(trimToNull(request.getApprovedBy()));
        rule.setSignedMemoReference(trimToNull(request.getSignedMemoReference()));
        rule.setPublished(false);

        return toVersionResponse(taxRuleVersionRepository.save(rule));
    }

    @Override
    @Transactional
    public TaxRuleVersionResponse publishRule(Long ruleId) {
        TaxRuleVersion rule = taxRuleVersionRepository.findById(ruleId)
                .orElseThrow(() -> new IllegalArgumentException("Tax rule not found"));
        if (!"CA_APPROVED".equalsIgnoreCase(rule.getApprovalStatus())) {
            throw new IllegalArgumentException("Only CA-approved tax rules can be published");
        }

        rule.setPublished(true);
        return toVersionResponse(taxRuleVersionRepository.save(rule));
    }

    @Override
    @Transactional(readOnly = true)
    public List<TaxRuleVersionResponse> getRules(String ruleType, String taxClass, Boolean published) {
        String normalizedType = normalizeNullable(ruleType);
        String normalizedTaxClass = normalizeNullable(taxClass);

        return taxRuleVersionRepository.findAll().stream()
                .filter(rule -> normalizedType == null || normalizedType.equalsIgnoreCase(rule.getRuleType()))
                .filter(rule -> normalizedTaxClass == null || normalizedTaxClass.equalsIgnoreCase(rule.getTaxClass()))
                .filter(rule -> published == null || published.equals(rule.isPublished()))
                .sorted(Comparator
                        .comparing(TaxRuleVersion::getEffectiveFrom, Comparator.nullsLast(Comparator.reverseOrder()))
                        .thenComparing(TaxRuleVersion::getId, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(this::toVersionResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true, noRollbackFor = IllegalArgumentException.class)
    public TaxRuleResolutionResponse resolveRule(ResolveTaxRuleRequest request) {
        String normalizedRuleType = normalizeRuleType(request.getRuleType());
        String requestedTaxClass = normalizeNullable(request.getTaxClass());
        String requestedHsnCode = normalizeNullable(request.getHsnCode());
        String requestedSupplyType = normalizeNullable(request.getSupplyType());
        LocalDate effectiveDate = request.getEffectiveDate() == null ? LocalDate.now() : request.getEffectiveDate();
        Double taxableValue = request.getTaxableValue();
        Double sellingPricePerPiece = request.getSellingPricePerPiece();

        if (taxableValue != null && taxableValue < 0) {
            throw new IllegalArgumentException("Taxable value cannot be negative");
        }
        if (sellingPricePerPiece != null && sellingPricePerPiece < 0) {
            throw new IllegalArgumentException("Selling price per piece cannot be negative");
        }

        List<TaxRuleVersion> candidates = taxRuleVersionRepository
                .findByRuleTypeIgnoreCaseAndPublishedTrueAndEffectiveFromLessThanEqual(normalizedRuleType, effectiveDate)
                .stream()
                .filter(rule -> rule.getEffectiveTo() == null || !rule.getEffectiveTo().isBefore(effectiveDate))
                .filter(rule -> !productionApprovedOnly || "CA_APPROVED".equalsIgnoreCase(rule.getApprovalStatus()))
                .filter(rule -> matchesRuleDimension(rule.getTaxClass(), requestedTaxClass))
                .filter(rule -> matchesRuleDimension(rule.getHsnCode(), requestedHsnCode))
                .filter(rule -> matchesRuleDimension(rule.getSupplyType(), requestedSupplyType))
                .filter(rule -> matchesComparisonRange(rule, taxableValue, sellingPricePerPiece))
                .sorted(Comparator
                        .comparingInt((TaxRuleVersion rule) -> scoreRule(
                                rule,
                                requestedTaxClass,
                                requestedHsnCode,
                                requestedSupplyType,
                                taxableValue,
                                sellingPricePerPiece
                        ))
                        .reversed()
                        .thenComparing(TaxRuleVersion::getEffectiveFrom, Comparator.nullsLast(Comparator.reverseOrder()))
                        .thenComparing(TaxRuleVersion::getId, Comparator.nullsLast(Comparator.reverseOrder())))
                .toList();

        if (candidates.isEmpty()) {
            throw new IllegalArgumentException("No published tax rule available for the provided criteria");
        }

        TaxRuleVersion selected = candidates.get(0);
        double normalizedTaxableValue = taxableValue == null ? 0.0 : taxableValue;
        double comparisonValue = resolveComparisonValue(selected, taxableValue, sellingPricePerPiece);
        double taxAmount = BigDecimal.valueOf(normalizedTaxableValue)
                .multiply(BigDecimal.valueOf(selected.getRatePercentage() / 100.0))
                .setScale(2, RoundingMode.HALF_UP)
                .doubleValue();

        TaxRuleResolutionResponse response = new TaxRuleResolutionResponse();
        response.setRuleId(selected.getId());
        response.setRuleCode(selected.getRuleCode());
        response.setRuleType(selected.getRuleType());
        response.setTaxClass(selected.getTaxClass());
        response.setHsnCode(selected.getHsnCode());
        response.setSupplyType(selected.getSupplyType());
        response.setValueBasis(selected.getValueBasis());
        response.setComparisonValue(roundCurrency(comparisonValue));
        response.setAppliedRatePercentage(selected.getRatePercentage());
        response.setTaxableValue(roundCurrency(normalizedTaxableValue));
        response.setTaxAmount(taxAmount);
        response.setEffectiveFrom(selected.getEffectiveFrom());
        response.setEffectiveTo(selected.getEffectiveTo());
        response.setResolvedForDate(effectiveDate);
        response.setApprovalStatus(selected.getApprovalStatus());
        response.setApprovedAt(selected.getApprovedAt() == null ? null : selected.getApprovedAt().toLocalDate());
        response.setApprovedBy(selected.getApprovedBy());
        response.setSignedMemoReference(selected.getSignedMemoReference());
        return response;
    }

    private int scoreRule(
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

    private boolean matchesComparisonRange(
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

    private boolean matchesRuleDimension(String ruleValue, String requestedValue) {
        if (isWildcard(ruleValue)) {
            return true;
        }
        if (requestedValue == null) {
            return false;
        }
        return requestedValue.equalsIgnoreCase(ruleValue);
    }

    private boolean isExactMatch(String ruleValue, String requestedValue) {
        return requestedValue != null && ruleValue != null && requestedValue.equalsIgnoreCase(ruleValue);
    }

    private boolean isWildcard(String value) {
        if (value == null || value.isBlank()) {
            return true;
        }
        String normalized = value.trim();
        return "ANY".equalsIgnoreCase(normalized) || "*".equals(normalized);
    }

    private void validateTaxableRange(Double minTaxableValue, Double maxTaxableValue) {
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

    private void validateDateRange(LocalDate effectiveFrom, LocalDate effectiveTo) {
        if (effectiveFrom == null) {
            throw new IllegalArgumentException("Effective from date is required");
        }
        if (effectiveTo != null && effectiveTo.isBefore(effectiveFrom)) {
            throw new IllegalArgumentException("Effective to date cannot be before effective from date");
        }
    }

    private void validateRate(Double ratePercentage) {
        if (ratePercentage == null) {
            throw new IllegalArgumentException("Rate percentage is required");
        }
        if (ratePercentage < 0 || ratePercentage > 100) {
            throw new IllegalArgumentException("Rate percentage must be between 0 and 100");
        }
    }

    private String normalizeValueBasis(String valueBasis) {
        String normalized = normalizeNullable(valueBasis);
        if (normalized == null) {
            return "TAXABLE_VALUE";
        }
        if (SUPPORTED_VALUE_BASIS.stream().noneMatch(value -> value.equalsIgnoreCase(normalized))) {
            throw new IllegalArgumentException(
                    "Unsupported value basis. Allowed values: TAXABLE_VALUE, SELLING_PRICE_PER_PIECE"
            );
        }
        return normalized;
    }

    private String normalizeApprovalStatus(String approvalStatus) {
        String normalized = normalizeNullable(approvalStatus);
        if (normalized == null) {
            return "DRAFT";
        }
        if (SUPPORTED_APPROVAL_STATUSES.stream().noneMatch(value -> value.equalsIgnoreCase(normalized))) {
            throw new IllegalArgumentException(
                    "Unsupported approval status. Allowed values: DRAFT, CA_APPROVED, REJECTED"
            );
        }
        return normalized;
    }

    private String normalizeRuleType(String ruleType) {
        String normalized = normalizeRequired(ruleType, "Rule type is required");
        if (SUPPORTED_RULE_TYPES.stream().noneMatch(type -> type.equalsIgnoreCase(normalized))) {
            throw new IllegalArgumentException("Unsupported rule type. Allowed values: GST, TCS");
        }
        return normalized;
    }

    private String normalizeRequired(String value, String message) {
        String normalized = normalizeNullable(value);
        if (normalized == null) {
            throw new IllegalArgumentException(message);
        }
        return normalized;
    }

    private String normalizeNullable(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        if (trimmed.isBlank()) {
            return null;
        }
        return trimmed.toUpperCase();
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isBlank() ? null : trimmed;
    }

    private double roundRate(Double value) {
        return BigDecimal.valueOf(value)
                .setScale(4, RoundingMode.HALF_UP)
                .doubleValue();
    }

    private double roundCurrency(Double value) {
        return BigDecimal.valueOf(value)
                .setScale(2, RoundingMode.HALF_UP)
                .doubleValue();
    }

    private double resolveComparisonValue(
            TaxRuleVersion rule,
            Double taxableValue,
            Double sellingPricePerPiece
    ) {
        Double value = resolveNullableComparisonValue(rule, taxableValue, sellingPricePerPiece);
        return value == null ? 0.0 : value;
    }

    private Double resolveNullableComparisonValue(
            TaxRuleVersion rule,
            Double taxableValue,
            Double sellingPricePerPiece
    ) {
        String valueBasis = normalizeValueBasis(rule.getValueBasis());
        if ("SELLING_PRICE_PER_PIECE".equalsIgnoreCase(valueBasis)) {
            return sellingPricePerPiece;
        }
        return taxableValue;
    }

    private TaxRuleVersionResponse toVersionResponse(TaxRuleVersion rule) {
        TaxRuleVersionResponse response = new TaxRuleVersionResponse();
        response.setId(rule.getId());
        response.setRuleCode(rule.getRuleCode());
        response.setRuleType(rule.getRuleType());
        response.setTaxClass(rule.getTaxClass());
        response.setHsnCode(rule.getHsnCode());
        response.setSupplyType(rule.getSupplyType());
        response.setValueBasis(rule.getValueBasis());
        response.setMinTaxableValue(rule.getMinTaxableValue());
        response.setMaxTaxableValue(rule.getMaxTaxableValue());
        response.setRatePercentage(rule.getRatePercentage());
        response.setEffectiveFrom(rule.getEffectiveFrom());
        response.setEffectiveTo(rule.getEffectiveTo());
        response.setPublished(rule.isPublished());
        response.setSourceReference(rule.getSourceReference());
        response.setNotes(rule.getNotes());
        response.setApprovalStatus(rule.getApprovalStatus());
        response.setApprovedAt(rule.getApprovedAt() == null ? null : rule.getApprovedAt().toLocalDate());
        response.setApprovedBy(rule.getApprovedBy());
        response.setSignedMemoReference(rule.getSignedMemoReference());
        return response;
    }
}
