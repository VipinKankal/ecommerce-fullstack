package com.example.ecommerce.order.response;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class OrderSettlementResponse {
    private Long id;
    private Long orderId;
    private Long paymentOrderId;
    private Long sellerId;
    private String sellerName;
    private String orderType;
    private String settlementStatus;
    private Double grossCollectedAmount;
    private Double taxableValue;
    private Double gstAmount;
    private Double commissionAmount;
    private Double commissionGstAmount;
    private Double tcsRatePercentage;
    private Double tcsAmount;
    private Double sellerPayableAmount;
    private Double sellerGstLiabilityAmount;
    private Double adminRevenueAmount;
    private Double adminGstLiabilityAmount;
    private String currencyCode;
    private String payoutReference;
    private String notes;
    private LocalDateTime ledgerPostedAt;
    private LocalDateTime createdAt;
}
