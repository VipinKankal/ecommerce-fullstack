package com.example.ecommerce.seller.controller;

import com.example.ecommerce.tax.request.ResolveTaxRuleRequest;
import com.example.ecommerce.tax.response.TaxRuleResolutionResponse;
import com.example.ecommerce.tax.service.TaxRuleVersionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/sellers/tax-rules")
@PreAuthorize("hasRole('SELLER')")
public class SellerTaxRuleController {

    private final TaxRuleVersionService taxRuleVersionService;

    @PostMapping("/resolve")
    public ResponseEntity<TaxRuleResolutionResponse> resolveRule(
            @Valid @RequestBody ResolveTaxRuleRequest request
    ) {
        return ResponseEntity.ok(taxRuleVersionService.resolveRule(request));
    }
}
