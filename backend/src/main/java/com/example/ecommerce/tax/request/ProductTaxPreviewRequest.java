package com.example.ecommerce.tax.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.LocalDate;

@Data
public class ProductTaxPreviewRequest {

    @NotBlank(message = "UI category key is required")
    private String uiCategoryKey;

    private String subcategoryKey;
    private String gender;
    private String fabricType;

    @NotBlank(message = "Construction type is required")
    private String constructionType;

    private String fiberFamily;
    private String hsnSelectionMode;
    private String overrideRequestedHsnCode;
    private String hsnOverrideReason;
    private String pricingMode;
    private String taxClass;
    private String taxRuleVersion;
    private String supplyType;
    private LocalDate effectiveDate;

    @Min(value = 0, message = "Selling price per piece cannot be negative")
    private Double sellingPricePerPiece;

    @Min(value = 0, message = "Cost price cannot be negative")
    private Double costPrice;

    @Min(value = 0, message = "Platform commission cannot be negative")
    private Double platformCommission;
}
