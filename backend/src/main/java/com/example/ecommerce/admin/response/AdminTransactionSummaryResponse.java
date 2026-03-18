package com.example.ecommerce.admin.response;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class AdminTransactionSummaryResponse {
    private Long id;
    private LocalDateTime date;
    private String customerName;
    private String customerEmail;
    private String customerPhone;
    private String sellerName;
    private Integer amount;
    private String orderStatus;
    private String paymentStatus;
}
