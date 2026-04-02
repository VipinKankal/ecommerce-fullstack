package com.example.ecommerce.tax.service.impl;

import com.example.ecommerce.compliance.service.ComplianceSellerNoteService;
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
import java.util.LinkedHashMap;
import java.util.List;

@Service
@RequiredArgsConstructor
public class HsnMasterServiceImpl implements HsnMasterService {

    private final HsnMasterRuleRepository hsnMasterRuleRepository;
    private final ComplianceSellerNoteService complianceSellerNoteService;

    @Override
    @Transactional
    public HsnMasterRule createRule(CreateHsnMasterRuleRequest request) {
        String normalizedRuleCode = HsnMasterRuleSupport.normalizeUpper(request.getRuleCode(), "Rule code is required");
        if (hsnMasterRuleRepository.findByRuleCodeIgnoreCase(normalizedRuleCode).isPresent()) {
            throw new IllegalArgumentException("HSN master rule code already exists");
        }

        HsnMasterRule rule = new HsnMasterRule();
        rule.setRuleCode(normalizedRuleCode);
        HsnMasterRuleSupport.applyCreateOrUpdate(rule, request);
        rule.setPublished(false);
        HsnMasterRule savedRule = hsnMasterRuleRepository.save(rule);
        triggerAutoDraft("HSN_RULE_CREATED", savedRule);
        return savedRule;
    }

    @Override
    @Transactional
    public HsnMasterRule updateRule(Long ruleId, UpdateHsnMasterRuleRequest request) {
        HsnMasterRule rule = hsnMasterRuleRepository.findById(ruleId)
                .orElseThrow(() -> new IllegalArgumentException("HSN master rule not found"));

        if (request.getDisplayLabel() != null) {
            rule.setDisplayLabel(HsnMasterRuleSupport.normalizeDisplayLabel(request.getDisplayLabel()));
        }
        if (request.getConstructionType() != null) {
            rule.setConstructionType(HsnMasterRuleSupport.normalizeUpper(request.getConstructionType(), null));
        }
        if (request.getGender() != null) {
            rule.setGender(HsnMasterRuleSupport.normalizeUpper(request.getGender(), null));
        }
        if (request.getFiberFamily() != null) {
            rule.setFiberFamily(HsnMasterRuleSupport.normalizeUpper(request.getFiberFamily(), null));
        }
        if (request.getHsnChapter() != null) {
            rule.setHsnChapter(HsnMasterRuleSupport.normalizeUpper(request.getHsnChapter(), null));
        }
        if (request.getHsnCode() != null) {
            rule.setHsnCode(HsnMasterRuleSupport.normalizeUpper(request.getHsnCode(), null));
        }
        if (request.getTaxClass() != null) {
            rule.setTaxClass(HsnMasterRuleSupport.normalizeUpper(request.getTaxClass(), null));
        }
        if (request.getMappingMode() != null) {
            rule.setMappingMode(HsnMasterRuleSupport.normalizeMappingMode(request.getMappingMode()));
        }
        if (request.getEffectiveFrom() != null) {
            rule.setEffectiveFrom(request.getEffectiveFrom());
        }
        if (request.getEffectiveTo() != null || rule.getEffectiveTo() != null) {
            rule.setEffectiveTo(request.getEffectiveTo());
        }
        if (request.getApprovalStatus() != null) {
            rule.setApprovalStatus(HsnMasterRuleSupport.normalizeApprovalStatus(request.getApprovalStatus()));
        }
        if (request.getSourceReference() != null) {
            rule.setSourceReference(HsnMasterRuleSupport.trimToNull(request.getSourceReference()));
        }
        if (request.getNotes() != null) {
            rule.setNotes(HsnMasterRuleSupport.trimToNull(request.getNotes()));
        }

        HsnMasterRuleSupport.validateDateRange(rule.getEffectiveFrom(), rule.getEffectiveTo());
        HsnMasterRule savedRule = hsnMasterRuleRepository.save(rule);
        triggerAutoDraft("HSN_RULE_UPDATED", savedRule);
        return savedRule;
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
        HsnMasterRule savedRule = hsnMasterRuleRepository.save(rule);
        triggerAutoDraft("HSN_RULE_PUBLISHED", savedRule);
        return savedRule;
    }

    @Override
    @Transactional(readOnly = true)
    public List<HsnMasterRule> getRules(String uiCategoryKey, Boolean published) {
        String normalizedCategory = HsnMasterRuleSupport.normalizeUiCategoryKey(uiCategoryKey);
        return hsnMasterRuleRepository.findAll().stream()
                .filter(rule -> normalizedCategory == null || normalizedCategory.equalsIgnoreCase(rule.getUiCategoryKey()))
                .filter(rule -> published == null || published.equals(rule.isPublished()))
                .sorted(Comparator.comparing(HsnMasterRule::getEffectiveFrom, Comparator.nullsLast(Comparator.reverseOrder()))
                        .thenComparing(HsnMasterRule::getId, Comparator.nullsLast(Comparator.reverseOrder())))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public HsnMasterRule resolveSuggestion(String uiCategoryKey, String constructionType, String gender, String fiberFamily, LocalDate effectiveDate) {
        String normalizedCategory = HsnMasterRuleSupport.normalizeUiCategoryKey(uiCategoryKey);
        if (normalizedCategory == null) {
            return null;
        }

        String normalizedConstructionType = HsnMasterRuleSupport.normalizeUpper(constructionType, null);
        String normalizedGender = HsnMasterRuleSupport.normalizeUpper(gender, null);
        String normalizedFiberFamily = HsnMasterRuleSupport.normalizeUpper(fiberFamily, null);
        LocalDate resolvedEffectiveDate = effectiveDate == null ? LocalDate.now() : effectiveDate;

        return hsnMasterRuleRepository
                .findByUiCategoryKeyIgnoreCaseAndPublishedTrueAndEffectiveFromLessThanEqual(normalizedCategory, resolvedEffectiveDate)
                .stream()
                .filter(rule -> "CA_APPROVED".equalsIgnoreCase(rule.getApprovalStatus()))
                .filter(rule -> rule.getEffectiveTo() == null || !rule.getEffectiveTo().isBefore(resolvedEffectiveDate))
                .filter(rule -> HsnMasterRuleSupport.matchesDimension(rule.getConstructionType(), normalizedConstructionType))
                .filter(rule -> HsnMasterRuleSupport.matchesDimension(rule.getGender(), normalizedGender))
                .filter(rule -> HsnMasterRuleSupport.matchesDimension(rule.getFiberFamily(), normalizedFiberFamily))
                .sorted(Comparator.comparingInt((HsnMasterRule rule) -> HsnMasterRuleSupport.scoreRule(rule, normalizedConstructionType, normalizedGender, normalizedFiberFamily))
                        .reversed()
                        .thenComparing(HsnMasterRule::getEffectiveFrom, Comparator.nullsLast(Comparator.reverseOrder()))
                        .thenComparing(HsnMasterRule::getId, Comparator.nullsLast(Comparator.reverseOrder())))
                .findFirst()
                .orElse(null);
    }

    private void triggerAutoDraft(String eventType, HsnMasterRule rule) {
        try {
            LinkedHashMap<String, Object> payload = new LinkedHashMap<>();
            payload.put("noteType", "HSN");
            payload.put("priority", "HIGH");
            payload.put("title", "%s: %s".formatted(eventType.replace('_', ' '), rule.getRuleCode()));
            payload.put("summary", "Backend HSN event captured for %s.".formatted(rule.getDisplayLabel()));
            payload.put("fullNote", "Rule Code: %s\nCategory: %s\nHSN: %s\nTax Class: %s\nEffective From: %s\n\nReview and publish seller-facing wording.".formatted(
                    rule.getRuleCode(),
                    rule.getUiCategoryKey(),
                    rule.getHsnCode(),
                    rule.getTaxClass(),
                    rule.getEffectiveFrom()
            ));
            payload.put("affectedCategory", rule.getUiCategoryKey());
            payload.put("actionRequired", "Review HSN mapping impact and publish seller advisory.");
            payload.put("businessEmail", "compliance@yourbusiness.com");
            if (rule.getEffectiveFrom() != null) {
                payload.put("effectiveDate", rule.getEffectiveFrom().toString());
            }
            complianceSellerNoteService.createAutoDraftFromEvent(eventType, payload, "system_hsn_event");
        } catch (Exception ignored) {
        }
    }
}
