package com.example.ecommerce.tax.response;

import lombok.Data;

import java.time.LocalDate;

@Data
public class SellerProductTaxPreviewResponse {
    private String uiCategoryKey;
    private String subcategoryKey;
    private String displayLabel;
    private String constructionType;
    private String gender;
    private String fabricType;
    private String fiberFamily;
    private String mappingMode;
    private String hsnChapter;
    private String suggestedHsnCode;
    private String resolvedHsnCode;
    private String requestedHsnCode;
    private String hsnSelectionMode;
    private String taxClass;
    private String gstRuleCode;
    private String tcsRuleCode;
    private LocalDate effectiveRuleDate;
    private String valueBasis;
    private String supplyTypeAssumption;
    private String placeOfSupplyStatus;
    private Double sellingPricePerPiece;
    private Double taxableValuePreview;
    private Double gstRatePreview;
    private Double gstAmountPreview;
    private Double commissionAmountPreview;
    private Double commissionGstPreview;
    private Double tcsAmountPreview;
    private Double netPayoutPreview;
    private Double estimatedProfitPreview;
    private Boolean requiresFiberSelection;
    private Boolean requiresReview;
    private String reviewStatus;
    private Boolean sellerTaxEligible;
    private String sellerTaxEligibilityStatus;
    private String sellerOnboardingPolicy;
    private String note;
}
