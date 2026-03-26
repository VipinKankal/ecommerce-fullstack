package com.example.ecommerce.tax.service;

import com.example.ecommerce.modal.HsnMasterRule;
import com.example.ecommerce.tax.request.CreateHsnMasterRuleRequest;
import com.example.ecommerce.tax.request.UpdateHsnMasterRuleRequest;

import java.time.LocalDate;
import java.util.List;

public interface HsnMasterService {
    HsnMasterRule createRule(CreateHsnMasterRuleRequest request);

    HsnMasterRule updateRule(Long ruleId, UpdateHsnMasterRuleRequest request);

    HsnMasterRule publishRule(Long ruleId);

    List<HsnMasterRule> getRules(String uiCategoryKey, Boolean published);

    HsnMasterRule resolveSuggestion(
            String uiCategoryKey,
            String constructionType,
            String gender,
            String fiberFamily,
            LocalDate effectiveDate
    );
}
