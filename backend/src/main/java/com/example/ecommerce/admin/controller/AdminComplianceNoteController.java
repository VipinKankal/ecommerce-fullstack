package com.example.ecommerce.admin.controller;

import com.example.ecommerce.admin.request.CreateComplianceSellerNoteRequest;
import com.example.ecommerce.admin.request.UpdateComplianceSellerNoteRequest;
import com.example.ecommerce.admin.response.ComplianceSellerNoteAdminResponse;
import com.example.ecommerce.admin.response.ComplianceSellerNoteAnalyticsResponse;
import com.example.ecommerce.admin.response.ComplianceSellerNoteImpactResponse;
import com.example.ecommerce.compliance.service.ComplianceSellerNoteService;
import com.example.ecommerce.common.configuration.AuthenticatedPrincipalService;
import com.example.ecommerce.modal.ComplianceSellerNote;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin/compliance/notes")
@PreAuthorize("hasRole('ADMIN')")
public class AdminComplianceNoteController {

    private final ComplianceSellerNoteService complianceSellerNoteService;
    private final AuthenticatedPrincipalService authenticatedPrincipalService;

    @GetMapping
    public ResponseEntity<List<ComplianceSellerNoteAdminResponse>> listNotes(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String noteType,
            @RequestParam(required = false, name = "q") String query
    ) {
        return ResponseEntity.ok(
                complianceSellerNoteService.listForAdmin(status, noteType, query).stream()
                        .map(this::toResponse)
                        .toList()
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<ComplianceSellerNoteAdminResponse> getNote(@PathVariable Long id) {
        return ResponseEntity.ok(toResponse(complianceSellerNoteService.getForAdmin(id)));
    }

    @GetMapping("/{id}/impact")
    public ResponseEntity<ComplianceSellerNoteImpactResponse> getNoteImpact(@PathVariable Long id) {
        return ResponseEntity.ok(toImpactResponse(complianceSellerNoteService.buildNoteImpactSummary(id)));
    }

    @GetMapping("/analytics")
    public ResponseEntity<ComplianceSellerNoteAnalyticsResponse> getAnalytics(
            @RequestParam(required = false) String noteType,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(required = false) Integer minImpactedSellers
    ) {
        return ResponseEntity.ok(
                toAnalyticsResponse(
                        complianceSellerNoteService.buildAnalyticsSummary(
                                noteType,
                                fromDate,
                                toDate,
                                minImpactedSellers
                        )
                )
        );
    }

    @GetMapping("/{id}/attachments/{attachmentId}/download")
    public ResponseEntity<Void> downloadAttachment(
            @PathVariable Long id,
            @PathVariable String attachmentId
    ) {
        Map<String, Object> attachment = complianceSellerNoteService.getAttachmentForAdmin(id, attachmentId);
        String attachmentUrl = complianceSellerNoteService.getAttachmentUrl(attachment);

        HttpHeaders headers = new HttpHeaders();
        headers.setLocation(URI.create(attachmentUrl));
        headers.setCacheControl("no-store, no-cache, must-revalidate, max-age=0");
        headers.setPragma("no-cache");
        return new ResponseEntity<>(headers, HttpStatus.SEE_OTHER);
    }

    @PostMapping
    public ResponseEntity<ComplianceSellerNoteAdminResponse> createNote(
            @Valid @RequestBody CreateComplianceSellerNoteRequest request
    ) {
        ComplianceSellerNote created = complianceSellerNoteService.create(request, actorEmail());
        return new ResponseEntity<>(toResponse(created), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ComplianceSellerNoteAdminResponse> updateNote(
            @PathVariable Long id,
            @Valid @RequestBody UpdateComplianceSellerNoteRequest request
    ) {
        return ResponseEntity.ok(
                toResponse(complianceSellerNoteService.update(id, request, actorEmail()))
        );
    }

    @PatchMapping("/{id}/publish")
    public ResponseEntity<ComplianceSellerNoteAdminResponse> publishNote(@PathVariable Long id) {
        return ResponseEntity.ok(
                toResponse(complianceSellerNoteService.publish(id, actorEmail()))
        );
    }

    @PatchMapping("/{id}/archive")
    public ResponseEntity<ComplianceSellerNoteAdminResponse> archiveNote(@PathVariable Long id) {
        return ResponseEntity.ok(
                toResponse(complianceSellerNoteService.archive(id, actorEmail()))
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNote(@PathVariable Long id) {
        complianceSellerNoteService.delete(id);
        return ResponseEntity.noContent().build();
    }

    private ComplianceSellerNoteAdminResponse toResponse(ComplianceSellerNote note) {
        Map<String, Object> impactSummary = complianceSellerNoteService.buildNoteImpactSummary(note.getId());
        ComplianceSellerNoteAdminResponse response = new ComplianceSellerNoteAdminResponse();
        response.setId(note.getId());
        response.setTitle(note.getTitle());
        response.setNoteType(note.getNoteType());
        response.setPriority(note.getPriority());
        response.setShortSummary(note.getShortSummary());
        response.setFullNote(note.getFullNote());
        response.setEffectiveDate(note.getEffectiveDate());
        response.setActionRequired(note.getActionRequired());
        response.setAffectedCategory(note.getAffectedCategory());
        response.setBusinessEmail(note.getBusinessEmail());
        response.setStatus(note.getStatus());
        response.setPinned(note.isPinned());
        response.setSourceMode(note.getSourceMode());
        response.setAttachments(buildAdminAttachmentResponse(note));
        response.setImpactedProductCount(asLong(impactSummary.get("impactedProductCount")));
        response.setImpactedProducts(asMapList(impactSummary.get("impactedProducts")));
        response.setAcknowledgedCount(asLong(impactSummary.get("acknowledgedCount")));
        response.setAcknowledgementRatePercentage(asDouble(impactSummary.get("acknowledgementRatePercentage")));
        response.setCreatedBy(note.getCreatedBy());
        response.setUpdatedBy(note.getUpdatedBy());
        response.setPublishedAt(note.getPublishedAt());
        response.setArchivedAt(note.getArchivedAt());
        response.setCreatedAt(note.getCreatedAt());
        response.setUpdatedAt(note.getUpdatedAt());
        return response;
    }

    private ComplianceSellerNoteImpactResponse toImpactResponse(Map<String, Object> payload) {
        ComplianceSellerNoteImpactResponse response = new ComplianceSellerNoteImpactResponse();
        response.setAffectedCategory(asString(payload.get("affectedCategory")));
        response.setImpactedProductCount(asLong(payload.get("impactedProductCount")));
        response.setCoverageScope(asString(payload.get("coverageScope")));
        response.setImpactedProducts(asMapList(payload.get("impactedProducts")));
        return response;
    }

    private ComplianceSellerNoteAnalyticsResponse toAnalyticsResponse(Map<String, Object> payload) {
        ComplianceSellerNoteAnalyticsResponse response = new ComplianceSellerNoteAnalyticsResponse();
        response.setTotalNotes(asLong(payload.get("totalNotes")));
        response.setDraftCount(asLong(payload.get("draftCount")));
        response.setPublishedCount(asLong(payload.get("publishedCount")));
        response.setArchivedCount(asLong(payload.get("archivedCount")));
        response.setHighPriorityCount(asLong(payload.get("highPriorityCount")));
        response.setSellerCount(asLong(payload.get("sellerCount")));
        response.setReadRatePercentage(asDouble(payload.get("readRatePercentage")));
        response.setAcknowledgementRatePercentage(asDouble(payload.get("acknowledgementRatePercentage")));
        response.setByType(asStringLongMap(payload.get("byType")));
        response.setByPriority(asStringLongMap(payload.get("byPriority")));
        response.setImpactTopNotes(asMapList(payload.get("impactTopNotes")));
        return response;
    }

    private String actorEmail() {
        try {
            return authenticatedPrincipalService.currentEmail();
        } catch (Exception ignored) {
            return "system_admin";
        }
    }

    private List<Map<String, Object>> buildAdminAttachmentResponse(ComplianceSellerNote note) {
        return complianceSellerNoteService.readAttachments(note).stream()
                .map(raw -> {
                    Map<String, Object> payload = new LinkedHashMap<>();
                    payload.put("id", raw.get("id"));
                    payload.put("name", raw.get("name"));
                    payload.put("uploadedAt", raw.get("uploadedAt"));
                    payload.put(
                            "downloadUrl",
                            String.format(
                                    "/api/admin/compliance/notes/%d/attachments/%s/download",
                                    note.getId(),
                                    raw.get("id")
                            )
                    );
                    return payload;
                })
                .toList();
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> asMapList(Object value) {
        if (value instanceof List<?> list) {
            return list.stream()
                    .filter(item -> item instanceof Map<?, ?>)
                    .map(item -> (Map<String, Object>) item)
                    .toList();
        }
        return List.of();
    }

    @SuppressWarnings("unchecked")
    private Map<String, Long> asStringLongMap(Object value) {
        if (!(value instanceof Map<?, ?> map)) {
            return Map.of();
        }
        LinkedHashMap<String, Long> result = new LinkedHashMap<>();
        map.forEach((key, item) -> result.put(String.valueOf(key), asLong(item)));
        return result;
    }

    private String asString(Object value) {
        return value == null ? null : String.valueOf(value);
    }

    private Long asLong(Object value) {
        if (value instanceof Number number) {
            return number.longValue();
        }
        if (value == null) {
            return 0L;
        }
        try {
            return Long.parseLong(String.valueOf(value));
        } catch (NumberFormatException ex) {
            return 0L;
        }
    }

    private Double asDouble(Object value) {
        if (value instanceof Number number) {
            return number.doubleValue();
        }
        if (value == null) {
            return 0.0;
        }
        try {
            return Double.parseDouble(String.valueOf(value));
        } catch (NumberFormatException ex) {
            return 0.0;
        }
    }
}
