package com.example.ecommerce.tax.service.impl;

import com.example.ecommerce.modal.HsnMasterRule;
import com.example.ecommerce.modal.Seller;
import com.example.ecommerce.tax.request.ProductTaxPreviewRequest;
import com.example.ecommerce.tax.response.SellerProductTaxPreviewResponse;
import com.example.ecommerce.tax.response.TaxRuleResolutionResponse;
import com.example.ecommerce.tax.service.HsnMasterService;
import com.example.ecommerce.tax.service.SellerProductTaxPreviewService;
import com.example.ecommerce.tax.service.TaxComputationSupport;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class SellerProductTaxPreviewServiceImpl implements SellerProductTaxPreviewService {

    private final HsnMasterService hsnMasterService;
    private final TaxComputationSupport taxComputationSupport;

    @Override
    public SellerProductTaxPreviewResponse preview(Seller seller, ProductTaxPreviewRequest request) {
        LocalDate effectiveDate = resolveEffectiveDate(request.getEffectiveDate());
        String normalizedUiCategoryKey = normalizeCategory(request.getUiCategoryKey());
        String normalizedConstructionType = normalizeUpper(request.getConstructionType());
        String normalizedGender = normalizeUpper(request.getGender());
        String normalizedFabricType = normalizeUpper(request.getFabricType());
        String normalizedFiberFamily = normalizeUpper(request.getFiberFamily());
        String normalizedSelectionMode = normalizeSelectionMode(
                request.getHsnSelectionMode(),
                request.getOverrideRequestedHsnCode()
        );
        String requestedHsnCode = normalizeUpper(request.getOverrideRequestedHsnCode());
        double sellingPricePerPiece = Math.max(request.getSellingPricePerPiece() == null ? 0.0 : request.getSellingPricePerPiece(), 0.0);
        double platformCommission = Math.max(request.getPlatformCommission() == null ? 0.0 : request.getPlatformCommission(), 0.0);
        double costPrice = Math.max(request.getCostPrice() == null ? 0.0 : request.getCostPrice(), 0.0);

        HsnMasterRule hsnRule = hsnMasterService.resolveSuggestion(
                normalizedUiCategoryKey,
                normalizedConstructionType,
                normalizedGender,
                normalizedFiberFamily,
                effectiveDate
        );

        boolean requiresFiberSelection = hsnRule != null
                && "FIBER_REQUIRED".equalsIgnoreCase(hsnRule.getMappingMode())
                && normalizedFiberFamily == null;
        String suggestedHsnCode = hsnRule == null ? null : normalizeUpper(hsnRule.getHsnCode());
        String mappingMode = hsnRule == null ? "UNMAPPED" : hsnRule.getMappingMode();
        boolean overrideRequested = requestedHsnCode != null
                && (suggestedHsnCode == null || !requestedHsnCode.equalsIgnoreCase(suggestedHsnCode));
        boolean requiresReview = overrideRequested || "RULE_BASED".equalsIgnoreCase(mappingMode);
        String resolvedHsnCode = requestedHsnCode != null ? requestedHsnCode : suggestedHsnCode;
        String taxClass = resolveTaxClass(request.getTaxClass(), hsnRule);
        String supplyTypeAssumption = normalizeUpper(request.getSupplyType()) == null
                ? "INTRA_STATE"
                : normalizeUpper(request.getSupplyType());

        TaxRuleResolutionResponse gstResolution = requiresFiberSelection
                ? null
                : taxComputationSupport.resolveGstRule(
                        taxClass,
                        resolvedHsnCode,
                        sellingPricePerPiece,
                        sellingPricePerPiece,
                        effectiveDate
                );
        boolean hasEffectiveGstRule = gstResolution != null && gstResolution.getRuleCode() != null;
        double appliedRate = gstResolution == null || gstResolution.getAppliedRatePercentage() == null
                ? 0.0
                : gstResolution.getAppliedRatePercentage();
        TaxComputationSupport.TaxAmounts taxAmounts = taxComputationSupport.computeAmounts(
                request.getPricingMode(),
                sellingPricePerPiece,
                appliedRate
        );

        TaxRuleResolutionResponse tcsResolution = taxComputationSupport.resolveTcsRule(
                taxAmounts.taxableValue(),
                supplyTypeAssumption,
                effectiveDate
        );
        double commissionGst = taxComputationSupport.roundCurrency(platformCommission * 0.18);
        double tcsAmount = tcsResolution == null || tcsResolution.getTaxAmount() == null
                ? 0.0
                : tcsResolution.getTaxAmount();
        double netPayout = taxComputationSupport.roundCurrency(
                taxAmounts.amountWithTax() - platformCommission - commissionGst - tcsAmount
        );
        Double estimatedProfit = costPrice > 0
                ? taxComputationSupport.roundCurrency(netPayout - costPrice)
                : null;

        SellerProductTaxPreviewResponse response = new SellerProductTaxPreviewResponse();
        response.setUiCategoryKey(normalizedUiCategoryKey);
        response.setSubcategoryKey(normalizeCategory(request.getSubcategoryKey()));
        response.setDisplayLabel(hsnRule == null ? null : hsnRule.getDisplayLabel());
        response.setConstructionType(normalizedConstructionType);
        response.setGender(normalizedGender);
        response.setFabricType(normalizedFabricType);
        response.setFiberFamily(normalizedFiberFamily);
        response.setMappingMode(mappingMode);
        response.setHsnChapter(hsnRule == null ? null : hsnRule.getHsnChapter());
        response.setSuggestedHsnCode(suggestedHsnCode);
        response.setResolvedHsnCode(resolvedHsnCode);
        response.setRequestedHsnCode(requestedHsnCode);
        response.setHsnSelectionMode(normalizedSelectionMode);
        response.setTaxClass(taxClass);
        response.setGstRuleCode(gstResolution == null ? null : gstResolution.getRuleCode());
        response.setTcsRuleCode(tcsResolution == null ? null : tcsResolution.getRuleCode());
        response.setEffectiveRuleDate(gstResolution == null ? effectiveDate : gstResolution.getEffectiveFrom());
        response.setValueBasis(gstResolution == null ? null : gstResolution.getValueBasis());
        response.setSupplyTypeAssumption(supplyTypeAssumption);
        response.setPlaceOfSupplyStatus("DEFERRED_TO_ORDER");
        response.setSellingPricePerPiece(taxComputationSupport.roundCurrency(sellingPricePerPiece));
        response.setTaxableValuePreview(taxAmounts.taxableValue());
        response.setGstRatePreview(taxComputationSupport.roundCurrency(appliedRate));
        response.setGstAmountPreview(taxAmounts.gstAmount());
        response.setCommissionAmountPreview(taxComputationSupport.roundCurrency(platformCommission));
        response.setCommissionGstPreview(commissionGst);
        response.setTcsAmountPreview(taxComputationSupport.roundCurrency(tcsAmount));
        response.setNetPayoutPreview(netPayout);
        response.setEstimatedProfitPreview(estimatedProfit);
        response.setRequiresFiberSelection(requiresFiberSelection);
        response.setRequiresReview(requiresReview || !hasEffectiveGstRule);
        response.setReviewStatus((requiresReview || !hasEffectiveGstRule) ? "PENDING_REVIEW" : "NOT_REQUIRED");
        response.setSellerTaxEligible(isSellerTaxEligible(seller));
        response.setSellerTaxEligibilityStatus(resolveSellerComplianceStatus(seller));
        response.setSellerOnboardingPolicy(seller == null ? null : seller.getGstOnboardingPolicy());
        response.setNote(buildNote(seller, hsnRule, requiresFiberSelection, requiresReview, hasEffectiveGstRule));
        return response;
    }

    private String buildNote(
            Seller seller,
            HsnMasterRule hsnRule,
            boolean requiresFiberSelection,
            boolean requiresReview,
            boolean hasEffectiveGstRule
    ) {
        if (!isSellerTaxEligible(seller)) {
            return "Seller tax eligibility is incomplete. Complete GST/compliance onboarding before publish.";
        }
        if (requiresFiberSelection) {
            return "CA-approved fibre mapping is required before the HSN can be locked.";
        }
        if (hsnRule == null) {
            return "No CA-approved HSN mapping is available for the selected category yet.";
        }
        if (!hasEffectiveGstRule) {
            return "No effective GST rule is active for the selected date. Please contact admin or wait for publish date.";
        }
        if (requiresReview) {
            return "This product needs admin tax review before it can go live with the selected HSN.";
        }
        return "Preview uses the currently CA-approved, published tax rule version.";
    }

    private LocalDate resolveEffectiveDate(LocalDate requestedDate) {
        LocalDate resolvedDate = requestedDate == null ? LocalDate.now() : requestedDate;
        if (resolvedDate.isAfter(LocalDate.now())) {
            throw new IllegalArgumentException("Effective date cannot be in the future for seller preview");
        }
        return resolvedDate;
    }

    private boolean isSellerTaxEligible(Seller seller) {
        String complianceStatus = resolveSellerComplianceStatus(seller);
        if ("ACTIVE_GSTIN".equalsIgnoreCase(complianceStatus)) {
            return true;
        }
        return "DECLARED_NON_GST".equalsIgnoreCase(complianceStatus)
                && seller != null
                && Boolean.TRUE.equals(seller.getGstDeclarationAccepted());
    }

    private String resolveSellerComplianceStatus(Seller seller) {
        if (seller == null) {
            return "UNKNOWN";
        }
        if (seller.getGstComplianceStatus() != null && !seller.getGstComplianceStatus().isBlank()) {
            return seller.getGstComplianceStatus();
        }
        if (seller.getGSTIN() != null && !seller.getGSTIN().isBlank()) {
            return "ACTIVE_GSTIN";
        }
        if (Boolean.TRUE.equals(seller.getGstDeclarationAccepted())) {
            return "DECLARED_NON_GST";
        }
        return "UNKNOWN";
    }

    private String resolveTaxClass(String requestedTaxClass, HsnMasterRule hsnRule) {
        String normalizedRequested = normalizeUpper(requestedTaxClass);
        if (normalizedRequested != null) {
            return normalizedRequested;
        }
        if (hsnRule != null && hsnRule.getTaxClass() != null && !hsnRule.getTaxClass().isBlank()) {
            return hsnRule.getTaxClass();
        }
        return "APPAREL_STANDARD";
    }

    private String normalizeSelectionMode(String rawSelectionMode, String requestedHsnCode) {
        String normalizedSelectionMode = normalizeUpper(rawSelectionMode);
        if (normalizedSelectionMode != null) {
            return normalizedSelectionMode;
        }
        return requestedHsnCode == null || requestedHsnCode.isBlank()
                ? "AUTO_SUGGESTED"
                : "SELLER_OVERRIDE";
    }

    private String normalizeCategory(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim().toLowerCase();
        return trimmed.isBlank() ? null : trimmed;
    }

    private String normalizeUpper(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isBlank() ? null : trimmed.toUpperCase();
    }
}
