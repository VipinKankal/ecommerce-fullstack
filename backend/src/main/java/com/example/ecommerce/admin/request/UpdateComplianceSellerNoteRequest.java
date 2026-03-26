package com.example.ecommerce.admin.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Data
public class UpdateComplianceSellerNoteRequest {

    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Note type is required")
    private String noteType;

    @NotBlank(message = "Priority is required")
    private String priority;

    @NotBlank(message = "Short summary is required")
    private String shortSummary;

    @NotBlank(message = "Full note is required")
    private String fullNote;

    private LocalDate effectiveDate;
    private String actionRequired;
    private String affectedCategory;

    @NotBlank(message = "Business email is required")
    private String businessEmail;

    private String status;
    private Boolean pinned;
    private String sourceMode;
    private List<Map<String, Object>> attachments;
}

