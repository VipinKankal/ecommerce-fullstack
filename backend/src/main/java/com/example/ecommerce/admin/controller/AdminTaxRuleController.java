package com.example.ecommerce.admin.controller;

import com.example.ecommerce.tax.request.CreateTaxRuleVersionRequest;
import com.example.ecommerce.tax.request.ResolveTaxRuleRequest;
import com.example.ecommerce.tax.response.TaxRuleResolutionResponse;
import com.example.ecommerce.tax.response.TaxRuleVersionResponse;
import com.example.ecommerce.tax.service.TaxRuleVersionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin/tax-rules")
@PreAuthorize("hasRole('ADMIN')")
public class AdminTaxRuleController {

    private final TaxRuleVersionService taxRuleVersionService;

    @PostMapping
    public ResponseEntity<TaxRuleVersionResponse> createRule(
            @Valid @RequestBody CreateTaxRuleVersionRequest request
    ) {
        return new ResponseEntity<>(taxRuleVersionService.createRule(request), HttpStatus.CREATED);
    }

    @PatchMapping("/{id}/publish")
    public ResponseEntity<TaxRuleVersionResponse> publishRule(@PathVariable Long id) {
        return ResponseEntity.ok(taxRuleVersionService.publishRule(id));
    }

    @GetMapping
    public ResponseEntity<List<TaxRuleVersionResponse>> getRules(
            @RequestParam(required = false) String ruleType,
            @RequestParam(required = false) String taxClass,
            @RequestParam(required = false) Boolean published
    ) {
        return ResponseEntity.ok(taxRuleVersionService.getRules(ruleType, taxClass, published));
    }

    @PostMapping("/resolve")
    public ResponseEntity<TaxRuleResolutionResponse> resolveRule(
            @Valid @RequestBody ResolveTaxRuleRequest request
    ) {
        return ResponseEntity.ok(taxRuleVersionService.resolveRule(request));
    }
}
