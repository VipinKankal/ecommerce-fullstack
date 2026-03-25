package com.example.ecommerce.order.response;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class SettlementLedgerEntryResponse {
    private Long id;
    private Long settlementId;
    private Long orderId;
    private Long paymentOrderId;
    private Long sellerId;
    private String sellerName;
    private String orderType;
    private String entryGroup;
    private String entryDirection;
    private String accountCode;
    private String accountName;
    private Double amount;
    private String currencyCode;
    private String note;
    private LocalDateTime createdAt;
}
