package com.example.ecommerce.tax.service.impl;

import com.example.ecommerce.modal.HsnMasterRule;
import com.example.ecommerce.repository.HsnMasterRuleRepository;
import com.example.ecommerce.tax.request.CreateHsnMasterRuleRequest;
import com.example.ecommerce.tax.request.UpdateHsnMasterRuleRequest;
import com.example.ecommerce.tax.service.HsnMasterService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class HsnMasterServiceImpl implements HsnMasterService {

    private static final List<String> SUPPORTED_MAPPING_MODES = List.of(
            "DIRECT",
            "FIBER_REQUIRED",
            "RULE_BASED"
    );

    private final HsnMasterRuleRepository hsnMasterRuleRepository;

    @Override
    @Transactional
    public HsnMasterRule createRule(CreateHsnMasterRuleRequest request) {
        String normalizedRuleCode = normalizeUpper(request.getRuleCode(), "Rule code is required");
        if (hsnMasterRuleRepository.findByRuleCodeIgnoreCase(normalizedRuleCode).isPresent()) {
            throw new IllegalArgumentException("HSN master rule code already exists");
        }

        HsnMasterRule rule = new HsnMasterRule();
        rule.setRuleCode(normalizedRuleCode);
        applyCreateOrUpdate(rule, request);
        rule.setPublished(false);
        return hsnMasterRuleRepository.save(rule);
    }

    @Override
    @Transactional
    public HsnMasterRule updateRule(Long ruleId, UpdateHsnMasterRuleRequest request) {
        HsnMasterRule rule = hsnMasterRuleRepository.findById(ruleId)
                .orElseThrow(() -> new IllegalArgumentException("HSN master rule not found"));

        if (request.getDisplayLabel() != null) {
            rule.setDisplayLabel(normalizeDisplayLabel(request.getDisplayLabel()));
        }
        if (request.getConstructionType() != null) {
            rule.setConstructionType(normalizeUpper(request.getConstructionType(), null));
        }
        if (request.getGender() != null) {
            rule.setGender(normalizeUpper(request.getGender(), null));
        }
        if (request.getFiberFamily() != null) {
            rule.setFiberFamily(normalizeUpper(request.getFiberFamily(), null));
        }
        if (request.getHsnChapter() != null) {
            rule.setHsnChapter(normalizeUpper(request.getHsnChapter(), null));
        }
        if (request.getHsnCode() != null) {
            rule.setHsnCode(normalizeUpper(request.getHsnCode(), null));
        }
        if (request.getTaxClass() != null) {
            rule.setTaxClass(normalizeUpper(request.getTaxClass(), null));
        }
        if (request.getMappingMode() != null) {
            rule.setMappingMode(normalizeMappingMode(request.getMappingMode()));
        }
        if (request.getEffectiveFrom() != null) {
            rule.setEffectiveFrom(request.getEffectiveFrom());
        }
        if (request.getEffectiveTo() != null || rule.getEffectiveTo() != null) {
            rule.setEffectiveTo(request.getEffectiveTo());
        }
        if (request.getApprovalStatus() != null) {
            rule.setApprovalStatus(normalizeApprovalStatus(request.getApprovalStatus()));
        }
        if (request.getSourceReference() != null) {
            rule.setSourceReference(trimToNull(request.getSourceReference()));
        }
        if (request.getNotes() != null) {
            rule.setNotes(trimToNull(request.getNotes()));
        }

        validateDateRange(rule.getEffectiveFrom(), rule.getEffectiveTo());
        return hsnMasterRuleRepository.save(rule);
    }

    @Override
    @Transactional
    public HsnMasterRule publishRule(Long ruleId) {
        HsnMasterRule rule = hsnMasterRuleRepository.findById(ruleId)
                .orElseThrow(() -> new IllegalArgumentException("HSN master rule not found"));
        if (!"CA_APPROVED".equalsIgnoreCase(rule.getApprovalStatus())) {
            throw new IllegalArgumentException("Only CA-approved HSN master rules can be published");
        }
        rule.setPublished(true);
        return hsnMasterRuleRepository.save(rule);
    }

    @Override
    @Transactional(readOnly = true)
    public List<HsnMasterRule> getRules(String uiCategoryKey, Boolean published) {
        String normalizedCategory = normalizeUiCategoryKey(uiCategoryKey);
        return hsnMasterRuleRepository.findAll().stream()
                .filter(rule -> normalizedCategory == null || normalizedCategory.equalsIgnoreCase(rule.getUiCategoryKey()))
                .filter(rule -> published == null || published.equals(rule.isPublished()))
                .sorted(Comparator
                        .comparing(HsnMasterRule::getEffectiveFrom, Comparator.nullsLast(Comparator.reverseOrder()))
                        .thenComparing(HsnMasterRule::getId, Comparator.nullsLast(Comparator.reverseOrder())))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public HsnMasterRule resolveSuggestion(
            String uiCategoryKey,
            String constructionType,
            String gender,
            String fiberFamily,
            LocalDate effectiveDate
    ) {
        String normalizedCategory = normalizeUiCategoryKey(uiCategoryKey);
        if (normalizedCategory == null) {
            return null;
        }

        String normalizedConstructionType = normalizeUpper(constructionType, null);
        String normalizedGender = normalizeUpper(gender, null);
        String normalizedFiberFamily = normalizeUpper(fiberFamily, null);
        LocalDate resolvedEffectiveDate = effectiveDate == null ? LocalDate.now() : effectiveDate;

        return hsnMasterRuleRepository
                .findByUiCategoryKeyIgnoreCaseAndPublishedTrueAndEffectiveFromLessThanEqual(
                        normalizedCategory,
                        resolvedEffectiveDate
                )
                .stream()
                .filter(rule -> "CA_APPROVED".equalsIgnoreCase(rule.getApprovalStatus()))
                .filter(rule -> rule.getEffectiveTo() == null || !rule.getEffectiveTo().isBefore(resolvedEffectiveDate))
                .filter(rule -> matchesDimension(rule.getConstructionType(), normalizedConstructionType))
                .filter(rule -> matchesDimension(rule.getGender(), normalizedGender))
                .filter(rule -> matchesDimension(rule.getFiberFamily(), normalizedFiberFamily))
                .sorted(Comparator
                        .comparingInt((HsnMasterRule rule) -> scoreRule(
                                rule,
                                normalizedConstructionType,
                                normalizedGender,
                                normalizedFiberFamily
                        ))
                        .reversed()
                        .thenComparing(HsnMasterRule::getEffectiveFrom, Comparator.nullsLast(Comparator.reverseOrder()))
                        .thenComparing(HsnMasterRule::getId, Comparator.nullsLast(Comparator.reverseOrder())))
                .findFirst()
                .orElse(null);
    }

    private void applyCreateOrUpdate(HsnMasterRule rule, CreateHsnMasterRuleRequest request) {
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

    private int scoreRule(
            HsnMasterRule rule,
            String constructionType,
            String gender,
            String fiberFamily
    ) {
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

    private boolean matchesDimension(String ruleValue, String requestedValue) {
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

    private void validateDateRange(LocalDate effectiveFrom, LocalDate effectiveTo) {
        if (effectiveFrom == null) {
            throw new IllegalArgumentException("Effective from date is required");
        }
        if (effectiveTo != null && effectiveTo.isBefore(effectiveFrom)) {
            throw new IllegalArgumentException("Effective to date cannot be before effective from date");
        }
    }

    private String normalizeDisplayLabel(String displayLabel) {
        String normalized = trimToNull(displayLabel);
        if (normalized == null) {
            throw new IllegalArgumentException("Display label is required");
        }
        return normalized;
    }

    private String normalizeMappingMode(String mappingMode) {
        String normalized = normalizeUpper(mappingMode, "Mapping mode is required");
        if (SUPPORTED_MAPPING_MODES.stream().noneMatch(value -> value.equalsIgnoreCase(normalized))) {
            throw new IllegalArgumentException(
                    "Unsupported mapping mode. Allowed values: DIRECT, FIBER_REQUIRED, RULE_BASED"
            );
        }
        return normalized;
    }

    private String normalizeApprovalStatus(String approvalStatus) {
        String normalized = normalizeUpper(approvalStatus, null);
        return normalized == null ? "DRAFT" : normalized;
    }

    private String normalizeUiCategoryKey(String uiCategoryKey) {
        if (uiCategoryKey == null) {
            return null;
        }
        String trimmed = uiCategoryKey.trim().toLowerCase();
        return trimmed.isBlank() ? null : trimmed;
    }

    private String normalizeUpper(String value, String message) {
        String normalized = trimToNull(value);
        if (normalized == null) {
            if (message != null) {
                throw new IllegalArgumentException(message);
            }
            return null;
        }
        return normalized.toUpperCase();
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isBlank() ? null : trimmed;
    }
}
