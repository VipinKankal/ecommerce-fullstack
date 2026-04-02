package com.example.ecommerce.tax.service.impl;

import com.example.ecommerce.compliance.service.ComplianceSellerNoteService;
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
import java.util.LinkedHashMap;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TaxRuleVersionServiceImpl implements TaxRuleVersionService {

    private final TaxRuleVersionRepository taxRuleVersionRepository;
    private final ComplianceSellerNoteService complianceSellerNoteService;

    @Value("${app.tax.production-approved-only:true}")
    private boolean productionApprovedOnly;

    @Override
    @Transactional
    public TaxRuleVersionResponse createRule(CreateTaxRuleVersionRequest request) {
        String normalizedRuleCode = TaxRuleVersionValidationSupport.normalizeRequired(request.getRuleCode(), "Rule code is required");
        String normalizedRuleType = TaxRuleVersionValidationSupport.normalizeRuleType(request.getRuleType());

        if (taxRuleVersionRepository.findByRuleCodeIgnoreCase(normalizedRuleCode).isPresent()) {
            throw new IllegalArgumentException("Tax rule code already exists");
        }

        TaxRuleVersionValidationSupport.validateDateRange(request.getEffectiveFrom(), request.getEffectiveTo());
        TaxRuleVersionValidationSupport.validateTaxableRange(request.getMinTaxableValue(), request.getMaxTaxableValue());
        TaxRuleVersionValidationSupport.validateRate(request.getRatePercentage());

        TaxRuleVersion rule = new TaxRuleVersion();
        rule.setRuleCode(normalizedRuleCode);
        rule.setRuleType(normalizedRuleType);
        rule.setTaxClass(TaxRuleVersionValidationSupport.normalizeNullable(request.getTaxClass()));
        rule.setHsnCode(TaxRuleVersionValidationSupport.normalizeNullable(request.getHsnCode()));
        rule.setSupplyType(TaxRuleVersionValidationSupport.normalizeNullable(request.getSupplyType()));
        rule.setValueBasis(TaxRuleVersionValidationSupport.normalizeValueBasis(request.getValueBasis()));
        rule.setMinTaxableValue(request.getMinTaxableValue());
        rule.setMaxTaxableValue(request.getMaxTaxableValue());
        rule.setRatePercentage(TaxRuleVersionValidationSupport.roundRate(request.getRatePercentage()));
        rule.setEffectiveFrom(request.getEffectiveFrom());
        rule.setEffectiveTo(request.getEffectiveTo());
        rule.setSourceReference(TaxRuleVersionValidationSupport.trimToNull(request.getSourceReference()));
        rule.setNotes(TaxRuleVersionValidationSupport.trimToNull(request.getNotes()));
        rule.setApprovalStatus(TaxRuleVersionValidationSupport.normalizeApprovalStatus(request.getApprovalStatus()));
        rule.setApprovedAt(request.getApprovedAt() == null ? null : request.getApprovedAt().atStartOfDay());
        rule.setApprovedBy(TaxRuleVersionValidationSupport.trimToNull(request.getApprovedBy()));
        rule.setSignedMemoReference(TaxRuleVersionValidationSupport.trimToNull(request.getSignedMemoReference()));
        rule.setPublished(false);

        TaxRuleVersion savedRule = taxRuleVersionRepository.save(rule);
        triggerAutoDraft("TAX_RULE_CREATED", savedRule.getRuleType(), savedRule.getRuleCode(), savedRule.getEffectiveFrom(), savedRule.getTaxClass());
        return toVersionResponse(savedRule);
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
        TaxRuleVersion savedRule = taxRuleVersionRepository.save(rule);
        triggerAutoDraft("TAX_RULE_PUBLISHED", savedRule.getRuleType(), savedRule.getRuleCode(), savedRule.getEffectiveFrom(), savedRule.getTaxClass());
        return toVersionResponse(savedRule);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TaxRuleVersionResponse> getRules(String ruleType, String taxClass, Boolean published) {
        String normalizedType = TaxRuleVersionValidationSupport.normalizeNullable(ruleType);
        String normalizedTaxClass = TaxRuleVersionValidationSupport.normalizeNullable(taxClass);

        return taxRuleVersionRepository.findAll().stream()
                .filter(rule -> normalizedType == null || normalizedType.equalsIgnoreCase(rule.getRuleType()))
                .filter(rule -> normalizedTaxClass == null || normalizedTaxClass.equalsIgnoreCase(rule.getTaxClass()))
                .filter(rule -> published == null || published.equals(rule.isPublished()))
                .sorted(Comparator.comparing(TaxRuleVersion::getEffectiveFrom, Comparator.nullsLast(Comparator.reverseOrder()))
                        .thenComparing(TaxRuleVersion::getId, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(this::toVersionResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true, noRollbackFor = IllegalArgumentException.class)
    public TaxRuleResolutionResponse resolveRule(ResolveTaxRuleRequest request) {
        String normalizedRuleType = TaxRuleVersionValidationSupport.normalizeRuleType(request.getRuleType());
        String requestedTaxClass = TaxRuleVersionValidationSupport.normalizeNullable(request.getTaxClass());
        String requestedHsnCode = TaxRuleVersionValidationSupport.normalizeNullable(request.getHsnCode());
        String requestedSupplyType = TaxRuleVersionValidationSupport.normalizeNullable(request.getSupplyType());
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
                .filter(rule -> TaxRuleVersionResolutionSupport.matchesRuleDimension(rule.getTaxClass(), requestedTaxClass))
                .filter(rule -> TaxRuleVersionResolutionSupport.matchesRuleDimension(rule.getHsnCode(), requestedHsnCode))
                .filter(rule -> TaxRuleVersionResolutionSupport.matchesRuleDimension(rule.getSupplyType(), requestedSupplyType))
                .filter(rule -> TaxRuleVersionResolutionSupport.matchesComparisonRange(rule, taxableValue, sellingPricePerPiece))
                .sorted(Comparator.comparingInt((TaxRuleVersion rule) -> TaxRuleVersionResolutionSupport.scoreRule(rule, requestedTaxClass, requestedHsnCode, requestedSupplyType, taxableValue, sellingPricePerPiece))
                        .reversed()
                        .thenComparing(TaxRuleVersion::getEffectiveFrom, Comparator.nullsLast(Comparator.reverseOrder()))
                        .thenComparing(TaxRuleVersion::getId, Comparator.nullsLast(Comparator.reverseOrder())))
                .toList();

        if (candidates.isEmpty()) {
            throw new IllegalArgumentException("No published tax rule available for the provided criteria");
        }

        TaxRuleVersion selected = candidates.get(0);
        double normalizedTaxableValue = taxableValue == null ? 0.0 : taxableValue;
        double comparisonValue = TaxRuleVersionResolutionSupport.resolveComparisonValue(selected, taxableValue, sellingPricePerPiece);
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
        response.setComparisonValue(TaxRuleVersionValidationSupport.roundCurrency(comparisonValue));
        response.setAppliedRatePercentage(selected.getRatePercentage());
        response.setTaxableValue(TaxRuleVersionValidationSupport.roundCurrency(normalizedTaxableValue));
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

    private void triggerAutoDraft(String eventType, String ruleType, String ruleCode, LocalDate effectiveDate, String taxClass) {
        try {
            LinkedHashMap<String, Object> payload = new LinkedHashMap<>();
            payload.put("noteType", "TCS".equalsIgnoreCase(ruleType) ? "TCS" : "GST");
            payload.put("priority", "HIGH");
            payload.put("title", "%s: %s".formatted(eventType.replace('_', ' '), ruleCode));
            payload.put("summary", "Backend tax-rule event captured for %s (%s).".formatted(ruleType, ruleCode));
            payload.put("fullNote", "Rule Code: %s\nRule Type: %s\nTax Class: %s\nEffective From: %s\n\nReview and publish seller-facing wording.".formatted(
                    ruleCode,
                    ruleType,
                    taxClass == null ? "ANY" : taxClass,
                    effectiveDate == null ? "-" : effectiveDate
            ));
            payload.put("actionRequired", "Review impacted product tax mapping and publish seller note.");
            payload.put("businessEmail", "compliance@yourbusiness.com");
            if (effectiveDate != null) {
                payload.put("effectiveDate", effectiveDate.toString());
            }
            if (taxClass != null && !taxClass.isBlank()) {
                payload.put("affectedCategory", taxClass);
            }
            complianceSellerNoteService.createAutoDraftFromEvent(eventType, payload, "system_tax_event");
        } catch (Exception ignored) {
        }
    }
}
