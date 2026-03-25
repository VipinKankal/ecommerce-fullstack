package com.example.ecommerce.admin.response;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ComplianceChallanResponse {
    private Long id;
    private String taxStream;
    private String filingPeriod;
    private Double amount;
    private String challanReference;
    private String paymentStatus;
    private LocalDateTime paidAt;
    private String notes;
    private LocalDateTime createdAt;
}