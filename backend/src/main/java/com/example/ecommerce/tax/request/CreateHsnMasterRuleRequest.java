package com.example.ecommerce.tax.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class CreateHsnMasterRuleRequest {

    @NotBlank(message = "Rule code is required")
    private String ruleCode;

    @NotBlank(message = "UI category key is required")
    private String uiCategoryKey;

    @NotBlank(message = "Display label is required")
    private String displayLabel;

    private String constructionType;
    private String gender;
    private String fiberFamily;
    private String hsnChapter;
    private String hsnCode;
    private String taxClass;

    @NotBlank(message = "Mapping mode is required")
    private String mappingMode;

    @NotNull(message = "Effective from date is required")
    private LocalDate effectiveFrom;

    private LocalDate effectiveTo;
    private String approvalStatus;
    private String sourceReference;
    private String notes;
}
