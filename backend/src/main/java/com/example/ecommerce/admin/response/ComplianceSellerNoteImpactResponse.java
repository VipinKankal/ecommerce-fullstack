package com.example.ecommerce.admin.response;

import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
public class ComplianceSellerNoteImpactResponse {
    private String affectedCategory;
    private Long impactedProductCount;
    private String coverageScope;
    private List<Map<String, Object>> impactedProducts;
}

