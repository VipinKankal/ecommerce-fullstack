package com.example.ecommerce.admin.controller;

import com.example.ecommerce.modal.HsnMasterRule;
import com.example.ecommerce.tax.request.CreateHsnMasterRuleRequest;
import com.example.ecommerce.tax.request.UpdateHsnMasterRuleRequest;
import com.example.ecommerce.tax.response.HsnMasterRuleResponse;
import com.example.ecommerce.tax.service.HsnMasterService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin/hsn-master")
@PreAuthorize("hasRole('ADMIN')")
public class AdminHsnMasterController {

    private final HsnMasterService hsnMasterService;

    @PostMapping
    public ResponseEntity<HsnMasterRuleResponse> createRule(
            @Valid @RequestBody CreateHsnMasterRuleRequest request
    ) {
        return new ResponseEntity<>(toResponse(hsnMasterService.createRule(request)), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<HsnMasterRuleResponse> updateRule(
            @PathVariable Long id,
            @RequestBody UpdateHsnMasterRuleRequest request
    ) {
        return ResponseEntity.ok(toResponse(hsnMasterService.updateRule(id, request)));
    }

    @PatchMapping("/{id}/publish")
    public ResponseEntity<HsnMasterRuleResponse> publishRule(@PathVariable Long id) {
        return ResponseEntity.ok(toResponse(hsnMasterService.publishRule(id)));
    }

    @GetMapping
    public ResponseEntity<List<HsnMasterRuleResponse>> getRules(
            @RequestParam(required = false) String uiCategoryKey,
            @RequestParam(required = false) Boolean published
    ) {
        return ResponseEntity.ok(
                hsnMasterService.getRules(uiCategoryKey, published).stream()
                        .map(this::toResponse)
                        .toList()
        );
    }

    private HsnMasterRuleResponse toResponse(HsnMasterRule rule) {
        HsnMasterRuleResponse response = new HsnMasterRuleResponse();
        response.setId(rule.getId());
        response.setRuleCode(rule.getRuleCode());
        response.setUiCategoryKey(rule.getUiCategoryKey());
        response.setDisplayLabel(rule.getDisplayLabel());
        response.setConstructionType(rule.getConstructionType());
        response.setGender(rule.getGender());
        response.setFiberFamily(rule.getFiberFamily());
        response.setHsnChapter(rule.getHsnChapter());
        response.setHsnCode(rule.getHsnCode());
        response.setTaxClass(rule.getTaxClass());
        response.setMappingMode(rule.getMappingMode());
        response.setEffectiveFrom(rule.getEffectiveFrom());
        response.setEffectiveTo(rule.getEffectiveTo());
        response.setApprovalStatus(rule.getApprovalStatus());
        response.setPublished(rule.isPublished());
        response.setSourceReference(rule.getSourceReference());
        response.setNotes(rule.getNotes());
        return response;
    }
}
