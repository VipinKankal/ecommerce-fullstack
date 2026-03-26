package com.example.ecommerce.tax.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class CreateTaxRuleVersionRequest {

    @NotBlank(message = "Rule code is required")
    private String ruleCode;

    @NotBlank(message = "Rule type is required")
    private String ruleType;

    private String taxClass;
    private String hsnCode;
    private String supplyType;
    private String valueBasis;

    @Min(value = 0, message = "Minimum taxable value cannot be negative")
    private Double minTaxableValue;

    @Min(value = 0, message = "Maximum taxable value cannot be negative")
    private Double maxTaxableValue;

    @NotNull(message = "Rate percentage is required")
    @Min(value = 0, message = "Rate percentage cannot be negative")
    @Max(value = 100, message = "Rate percentage cannot exceed 100")
    private Double ratePercentage;

    @NotNull(message = "Effective from date is required")
    private LocalDate effectiveFrom;

    private LocalDate effectiveTo;
    private String sourceReference;
    private String notes;
    private String approvalStatus;
    private LocalDate approvedAt;
    private String approvedBy;
    private String signedMemoReference;
}
