package com.example.ecommerce.seller.response;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
public class ComplianceSellerNoteSellerResponse {
    private Long id;
    private String title;
    private String noteType;
    private String priority;
    private String shortSummary;
    private String fullNote;
    private LocalDate effectiveDate;
    private String actionRequired;
    private String affectedCategory;
    private String businessEmail;
    private String status;
    private boolean pinned;
    private String sourceMode;
    private boolean read;
    private boolean acknowledged;
    private LocalDateTime acknowledgedAt;
    private Long impactedProductCount;
    private List<Map<String, Object>> attachments;
    private LocalDateTime publishedAt;
    private LocalDateTime archivedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

