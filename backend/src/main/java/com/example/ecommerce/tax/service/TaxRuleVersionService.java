package com.example.ecommerce.tax.service;

import com.example.ecommerce.tax.request.CreateTaxRuleVersionRequest;
import com.example.ecommerce.tax.request.ResolveTaxRuleRequest;
import com.example.ecommerce.tax.response.TaxRuleResolutionResponse;
import com.example.ecommerce.tax.response.TaxRuleVersionResponse;

import java.util.List;

public interface TaxRuleVersionService {
    TaxRuleVersionResponse createRule(CreateTaxRuleVersionRequest request);

    TaxRuleVersionResponse publishRule(Long ruleId);

    List<TaxRuleVersionResponse> getRules(String ruleType, String taxClass, Boolean published);

    TaxRuleResolutionResponse resolveRule(ResolveTaxRuleRequest request);
}
