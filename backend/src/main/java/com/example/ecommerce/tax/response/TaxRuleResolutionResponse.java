package com.example.ecommerce.tax.response;

import lombok.Data;

import java.time.LocalDate;

@Data
public class TaxRuleResolutionResponse {
    private Long ruleId;
    private String ruleCode;
    private String ruleType;
    private String taxClass;
    private String hsnCode;
    private String supplyType;
    private String valueBasis;
    private Double comparisonValue;
    private Double appliedRatePercentage;
    private Double taxableValue;
    private Double taxAmount;
    private LocalDate effectiveFrom;
    private LocalDate effectiveTo;
    private LocalDate resolvedForDate;
    private String approvalStatus;
    private LocalDate approvedAt;
    private String approvedBy;
    private String signedMemoReference;
}
