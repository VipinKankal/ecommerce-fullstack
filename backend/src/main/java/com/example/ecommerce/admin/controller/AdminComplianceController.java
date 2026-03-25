package com.example.ecommerce.admin.controller;

import com.example.ecommerce.admin.request.CreateComplianceChallanRequest;
import com.example.ecommerce.admin.response.ComplianceChallanResponse;
import com.example.ecommerce.modal.ComplianceChallanRecord;
import com.example.ecommerce.repository.ComplianceChallanRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin/compliance")
@PreAuthorize("hasRole('ADMIN')")
public class AdminComplianceController {

    private final ComplianceChallanRecordRepository complianceChallanRecordRepository;

    @GetMapping("/challans")
    public ResponseEntity<List<ComplianceChallanResponse>> getChallans() {
        return ResponseEntity.ok(
                complianceChallanRecordRepository.findAllByOrderByPaidAtDescCreatedAtDesc().stream()
                        .map(this::toResponse)
                        .toList()
        );
    }

    @PostMapping("/challans")
    public ResponseEntity<ComplianceChallanResponse> createChallan(
            @RequestBody CreateComplianceChallanRequest request
    ) {
        validate(request);

        ComplianceChallanRecord record = new ComplianceChallanRecord();
        record.setTaxStream(normalize(request.getTaxStream(), "GST"));
        record.setFilingPeriod(request.getFilingPeriod().trim());
        record.setAmount(roundCurrency(request.getAmount()));
        record.setChallanReference(request.getChallanReference().trim());
        record.setPaymentStatus(normalize(request.getPaymentStatus(), "PAID"));
        record.setPaidAt(request.getPaidAt() == null ? LocalDateTime.now() : request.getPaidAt());
        record.setNotes(trimToNull(request.getNotes()));

        ComplianceChallanRecord savedRecord = complianceChallanRecordRepository.save(record);
        return new ResponseEntity<>(toResponse(savedRecord), HttpStatus.CREATED);
    }

    private void validate(CreateComplianceChallanRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Challan request is required");
        }
        if (request.getAmount() == null || request.getAmount() <= 0) {
            throw new IllegalArgumentException("Valid challan amount is required");
        }
        if (request.getChallanReference() == null || request.getChallanReference().isBlank()) {
            throw new IllegalArgumentException("Challan reference is required");
        }
        if (request.getFilingPeriod() == null || request.getFilingPeriod().isBlank()) {
            throw new IllegalArgumentException("Filing period is required");
        }
    }

    private ComplianceChallanResponse toResponse(ComplianceChallanRecord record) {
        ComplianceChallanResponse response = new ComplianceChallanResponse();
        response.setId(record.getId());
        response.setTaxStream(record.getTaxStream());
        response.setFilingPeriod(record.getFilingPeriod());
        response.setAmount(record.getAmount());
        response.setChallanReference(record.getChallanReference());
        response.setPaymentStatus(record.getPaymentStatus());
        response.setPaidAt(record.getPaidAt());
        response.setNotes(record.getNotes());
        response.setCreatedAt(record.getCreatedAt());
        return response;
    }

    private String normalize(String value, String fallback) {
        if (value == null || value.isBlank()) {
            return fallback;
        }
        return value.trim().toUpperCase(Locale.ROOT);
    }

    private String trimToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private double roundCurrency(Double value) {
        return BigDecimal.valueOf(value == null ? 0.0 : value)
                .setScale(2, RoundingMode.HALF_UP)
                .doubleValue();
    }
}