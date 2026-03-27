package com.example.ecommerce.admin.response;

import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
public class ComplianceSellerNoteAnalyticsResponse {
    private Long totalNotes;
    private Long draftCount;
    private Long publishedCount;
    private Long archivedCount;
    private Long highPriorityCount;
    private Long sellerCount;
    private Double readRatePercentage;
    private Double acknowledgementRatePercentage;
    private Map<String, Long> byType;
    private Map<String, Long> byPriority;
    private List<Map<String, Object>> impactTopNotes;
}

