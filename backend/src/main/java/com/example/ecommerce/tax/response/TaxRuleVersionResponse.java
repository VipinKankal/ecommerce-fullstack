package com.example.ecommerce.tax.response;

import lombok.Data;

import java.time.LocalDate;

@Data
public class TaxRuleVersionResponse {
    private Long id;
    private String ruleCode;
    private String ruleType;
    private String taxClass;
    private String hsnCode;
    private String supplyType;
    private String valueBasis;
    private Double minTaxableValue;
    private Double maxTaxableValue;
    private Double ratePercentage;
    private LocalDate effectiveFrom;
    private LocalDate effectiveTo;
    private boolean published;
    private String sourceReference;
    private String notes;
    private String approvalStatus;
    private LocalDate approvedAt;
    private String approvedBy;
    private String signedMemoReference;
}
