package com.example.ecommerce.tax.response;

import lombok.Data;

import java.time.LocalDate;

@Data
public class HsnMasterRuleResponse {
    private Long id;
    private String ruleCode;
    private String uiCategoryKey;
    private String displayLabel;
    private String constructionType;
    private String gender;
    private String fiberFamily;
    private String hsnChapter;
    private String hsnCode;
    private String taxClass;
    private String mappingMode;
    private LocalDate effectiveFrom;
    private LocalDate effectiveTo;
    private String approvalStatus;
    private boolean published;
    private String sourceReference;
    private String notes;
}
