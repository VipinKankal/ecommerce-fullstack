package com.example.ecommerce.admin.controller;

import com.example.ecommerce.admin.request.CreateComplianceSellerNoteRequest;
import com.example.ecommerce.admin.request.UpdateComplianceSellerNoteRequest;
import com.example.ecommerce.admin.response.ComplianceSellerNoteAdminResponse;
import com.example.ecommerce.compliance.service.ComplianceSellerNoteService;
import com.example.ecommerce.common.configuration.AuthenticatedPrincipalService;
import com.example.ecommerce.modal.ComplianceSellerNote;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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
        response.setCreatedBy(note.getCreatedBy());
        response.setUpdatedBy(note.getUpdatedBy());
        response.setPublishedAt(note.getPublishedAt());
        response.setArchivedAt(note.getArchivedAt());
        response.setCreatedAt(note.getCreatedAt());
        response.setUpdatedAt(note.getUpdatedAt());
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
}
