package com.example.ecommerce.tax.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.LocalDate;

@Data
public class ResolveTaxRuleRequest {

    @NotBlank(message = "Rule type is required")
    private String ruleType;

    private String taxClass;
    private String hsnCode;
    private String supplyType;

    @Min(value = 0, message = "Taxable value cannot be negative")
    private Double taxableValue;

    private LocalDate effectiveDate;
}
