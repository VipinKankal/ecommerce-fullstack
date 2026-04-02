package com.example.ecommerce.compliance.service.impl;

import com.example.ecommerce.admin.request.CreateComplianceSellerNoteRequest;
import com.example.ecommerce.admin.request.UpdateComplianceSellerNoteRequest;
import com.example.ecommerce.modal.ComplianceSellerNote;
import com.example.ecommerce.modal.ComplianceSellerNoteRead;
import com.example.ecommerce.modal.Seller;
import com.example.ecommerce.repository.ComplianceSellerNoteReadRepository;
import com.example.ecommerce.repository.ComplianceSellerNoteRepository;
import com.example.ecommerce.repository.SellerRepository;
import tools.jackson.databind.ObjectMapper;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;

final class ComplianceSellerNoteRequestSupport {

    private ComplianceSellerNoteRequestSupport() {
    }

    static ComplianceSellerNoteRead getOrCreateReadEntry(
            Long sellerId,
            Long noteId,
            ComplianceSellerNoteRepository noteRepository,
            ComplianceSellerNoteReadRepository readRepository,
            SellerRepository sellerRepository
    ) {
        ComplianceSellerNote note = getVisibleSellerNote(noteId, noteRepository);
        Seller seller = getSeller(sellerId, sellerRepository);
        ComplianceSellerNoteRead readEntry = readRepository
                .findBySeller_IdAndNote_Id(seller.getId(), note.getId())
                .orElseGet(ComplianceSellerNoteRead::new);
        readEntry.setNote(note);
        readEntry.setSeller(seller);
        return readEntry;
    }

    static Seller getSeller(Long sellerId, SellerRepository sellerRepository) {
        return sellerRepository.findById(sellerId)
                .orElseThrow(() -> new IllegalArgumentException("Seller not found"));
    }

    static void applyCreatePayload(
            ComplianceSellerNote note,
            CreateComplianceSellerNoteRequest request,
            ObjectMapper objectMapper,
            Set<String> allowedTypes,
            Set<String> allowedPriorities,
            Set<String> allowedStatuses,
            Set<String> allowedSourceModes,
            String allowedAttachmentHosts,
            int maxAttachmentCount,
            int maxAttachmentUrlLength
    ) {
        validateRequest(request);
        note.setTitle(trimRequired(request.getTitle(), "Title is required"));
        note.setNoteType(normalizeRequired(request.getNoteType(), allowedTypes, "Unsupported note type"));
        note.setPriority(normalizeRequired(request.getPriority(), allowedPriorities, "Unsupported note priority"));
        note.setShortSummary(trimRequired(request.getShortSummary(), "Short summary is required"));
        note.setFullNote(trimRequired(request.getFullNote(), "Full note is required"));
        note.setEffectiveDate(request.getEffectiveDate());
        note.setActionRequired(trimToNull(request.getActionRequired()));
        note.setAffectedCategory(trimToNull(request.getAffectedCategory()));
        note.setBusinessEmail(trimRequired(request.getBusinessEmail(), "Business email is required"));
        note.setPinned(Boolean.TRUE.equals(request.getPinned()));
        note.setSourceMode(normalizeWithFallback(request.getSourceMode(), "MANUAL", allowedSourceModes, "Unsupported source mode"));
        note.setStatus(normalizeWithFallback(request.getStatus(), "DRAFT", allowedStatuses, "Unsupported note status"));
        note.setAttachmentsJson(ComplianceSellerNoteAttachmentSupport.writeAttachments(
                request.getAttachments(),
                objectMapper,
                allowedAttachmentHosts,
                maxAttachmentCount,
                maxAttachmentUrlLength
        ));
    }

    static void applyUpdatePayload(
            ComplianceSellerNote note,
            UpdateComplianceSellerNoteRequest request,
            ObjectMapper objectMapper,
            Set<String> allowedTypes,
            Set<String> allowedPriorities,
            Set<String> allowedStatuses,
            Set<String> allowedSourceModes,
            String allowedAttachmentHosts,
            int maxAttachmentCount,
            int maxAttachmentUrlLength,
            List<Map<String, Object>> existingAttachments
    ) {
        validateRequest(request);
        note.setTitle(trimRequired(request.getTitle(), "Title is required"));
        note.setNoteType(normalizeRequired(request.getNoteType(), allowedTypes, "Unsupported note type"));
        note.setPriority(normalizeRequired(request.getPriority(), allowedPriorities, "Unsupported note priority"));
        note.setShortSummary(trimRequired(request.getShortSummary(), "Short summary is required"));
        note.setFullNote(trimRequired(request.getFullNote(), "Full note is required"));
        note.setEffectiveDate(request.getEffectiveDate());
        note.setActionRequired(trimToNull(request.getActionRequired()));
        note.setAffectedCategory(trimToNull(request.getAffectedCategory()));
        note.setBusinessEmail(trimRequired(request.getBusinessEmail(), "Business email is required"));
        note.setPinned(Boolean.TRUE.equals(request.getPinned()));
        note.setSourceMode(normalizeWithFallback(
                request.getSourceMode(),
                note.getSourceMode() == null ? "MANUAL" : note.getSourceMode(),
                allowedSourceModes,
                "Unsupported source mode"
        ));
        note.setStatus(normalizeWithFallback(
                request.getStatus(),
                note.getStatus() == null ? "DRAFT" : note.getStatus(),
                allowedStatuses,
                "Unsupported note status"
        ));
        note.setAttachmentsJson(ComplianceSellerNoteAttachmentSupport.writeAttachments(
                ComplianceSellerNoteAttachmentSupport.resolveUpdatedAttachments(
                        existingAttachments,
                        request.getAttachments()
                ),
                objectMapper,
                allowedAttachmentHosts,
                maxAttachmentCount,
                maxAttachmentUrlLength
        ));
    }

    static ComplianceSellerNote createAutoDraftNote(
            String eventType,
            Map<String, Object> eventPayload,
            String actorEmail,
            Set<String> allowedTypes,
            Set<String> allowedPriorities,
            Set<String> allowedStatuses,
            ObjectMapper objectMapper,
            String allowedAttachmentHosts,
            int maxAttachmentCount,
            int maxAttachmentUrlLength
    ) {
        String normalizedEventType = trimToNull(eventType);
        if (normalizedEventType == null) {
            throw new IllegalArgumentException("Event type is required");
        }

        Map<String, Object> payload = eventPayload == null ? Map.of() : eventPayload;
        String noteType = normalizeWithFallback(valueAsString(payload, "noteType"), "POLICY", allowedTypes, "Unsupported note type");
        String priority = normalizeWithFallback(valueAsString(payload, "priority"), "HIGH", allowedPriorities, "Unsupported note priority");
        String title = firstNonBlank(
                valueAsString(payload, "title"),
                "Auto Draft: " + normalizedEventType.replace('_', ' ')
        );
        String summary = firstNonBlank(
                valueAsString(payload, "summary"),
                "Compliance update captured from backend event: " + normalizedEventType
        );
        String fullNote = firstNonBlank(
                valueAsString(payload, "fullNote"),
                summary + "\n\nReview this draft before publish."
        );
        String businessEmail = firstNonBlank(valueAsString(payload, "businessEmail"), "compliance@yourbusiness.com");

        ComplianceSellerNote note = new ComplianceSellerNote();
        note.setTitle(trimRequired(title, "Title is required"));
        note.setNoteType(noteType);
        note.setPriority(priority);
        note.setShortSummary(trimRequired(summary, "Short summary is required"));
        note.setFullNote(trimRequired(fullNote, "Full note is required"));
        note.setEffectiveDate(valueAsLocalDate(payload.get("effectiveDate")));
        note.setActionRequired(trimToNull(valueAsString(payload, "actionRequired")));
        note.setAffectedCategory(trimToNull(valueAsString(payload, "affectedCategory")));
        note.setBusinessEmail(trimRequired(businessEmail, "Business email is required"));
        note.setStatus("DRAFT");
        note.setPinned(false);
        note.setSourceMode("AUTO_DRAFT");
        note.setAttachmentsJson(ComplianceSellerNoteAttachmentSupport.writeAttachments(
                List.of(),
                objectMapper,
                allowedAttachmentHosts,
                maxAttachmentCount,
                maxAttachmentUrlLength
        ));
        note.setCreatedBy(trimToNull(actorEmail) == null ? "system_auto_draft" : trimToNull(actorEmail));
        note.setUpdatedBy(note.getCreatedBy());
        applyStatusTransition(note, "DRAFT", false, allowedStatuses);
        return note;
    }

    static void applyStatusTransition(
            ComplianceSellerNote note,
            String status,
            boolean forceTimestamp,
            Set<String> allowedStatuses
    ) {
        String normalizedStatus = normalizeWithFallback(status, "DRAFT", allowedStatuses, "Unsupported note status");
        LocalDateTime now = LocalDateTime.now();
        note.setStatus(normalizedStatus);

        if ("PUBLISHED".equals(normalizedStatus)) {
            if (forceTimestamp || note.getPublishedAt() == null) {
                note.setPublishedAt(now);
            }
            note.setArchivedAt(null);
            return;
        }

        if ("ARCHIVED".equals(normalizedStatus)) {
            if (forceTimestamp || note.getArchivedAt() == null) {
                note.setArchivedAt(now);
            }
            return;
        }

        note.setArchivedAt(null);
    }

    private static ComplianceSellerNote getVisibleSellerNote(
            Long noteId,
            ComplianceSellerNoteRepository noteRepository
    ) {
        ComplianceSellerNote note = noteRepository.findById(noteId)
                .orElseThrow(() -> new IllegalArgumentException("Compliance note not found"));
        if ("DRAFT".equals(note.getStatus())) {
            throw new IllegalArgumentException("Draft notes are not visible to sellers");
        }
        return note;
    }

    private static void validateRequest(Object request) {
        if (request == null) {
            throw new IllegalArgumentException("Compliance note payload is required");
        }
    }

    private static String normalizeRequired(String value, Set<String> allowed, String errorMessage) {
        return ComplianceSellerNoteValueSupport.normalizeRequired(value, allowed, errorMessage);
    }

    private static String normalizeWithFallback(String value, String fallback, Set<String> allowed, String errorMessage) {
        return ComplianceSellerNoteValueSupport.normalizeWithFallback(value, fallback, allowed, errorMessage);
    }

    private static String trimRequired(String value, String errorMessage) {
        return ComplianceSellerNoteValueSupport.trimRequired(value, errorMessage);
    }

    private static String trimToNull(String value) {
        return ComplianceSellerNoteValueSupport.trimToNull(value);
    }

    private static String firstNonBlank(String first, String second) {
        return ComplianceSellerNoteValueSupport.firstNonBlank(first, second);
    }

    private static String valueAsString(Map<String, Object> payload, String key) {
        return ComplianceSellerNoteValueSupport.valueAsString(payload, key);
    }

    private static LocalDate valueAsLocalDate(Object value) {
        return ComplianceSellerNoteValueSupport.valueAsLocalDate(value);
    }
}
