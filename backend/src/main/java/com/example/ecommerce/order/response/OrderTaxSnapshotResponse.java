package com.example.ecommerce.order.response;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class OrderTaxSnapshotResponse {
    private Long id;
    private String orderType;
    private String supplierGstin;
    private String sellerStateCode;
    private String posStateCode;
    private String supplyType;
    private Double totalTaxableValue;
    private Double totalGstAmount;
    private Double totalAmountCharged;
    private Double totalAmountWithTax;
    private Double totalCommissionAmount;
    private Double totalCommissionGstAmount;
    private Double tcsRatePercentage;
    private Double tcsAmount;
    private String gstRuleVersion;
    private String tcsRuleVersion;
    private String snapshotSource;
    private LocalDateTime frozenAt;
}
