package com.example.ecommerce.admin.request;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class CreateComplianceChallanRequest {
    private String taxStream;
    private String filingPeriod;
    private Double amount;
    private String challanReference;
    private String paymentStatus;
    private LocalDateTime paidAt;
    private String notes;
}