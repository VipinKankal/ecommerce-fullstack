package com.example.ecommerce.tax.request;

import lombok.Data;

import java.time.LocalDate;

@Data
public class UpdateHsnMasterRuleRequest {
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
    private String sourceReference;
    private String notes;
}
