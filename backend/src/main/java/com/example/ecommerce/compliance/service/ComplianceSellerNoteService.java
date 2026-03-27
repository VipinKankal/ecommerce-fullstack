package com.example.ecommerce.compliance.service;

import com.example.ecommerce.admin.request.CreateComplianceSellerNoteRequest;
import com.example.ecommerce.admin.request.UpdateComplianceSellerNoteRequest;
import com.example.ecommerce.modal.ComplianceSellerNote;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public interface ComplianceSellerNoteService {
    List<ComplianceSellerNote> listForAdmin(String status, String noteType, String query);

    ComplianceSellerNote getForAdmin(Long noteId);

    ComplianceSellerNote create(CreateComplianceSellerNoteRequest request, String actorEmail);

    ComplianceSellerNote update(Long noteId, UpdateComplianceSellerNoteRequest request, String actorEmail);

    void delete(Long noteId);

    ComplianceSellerNote publish(Long noteId, String actorEmail);

    ComplianceSellerNote archive(Long noteId, String actorEmail);

    List<ComplianceSellerNote> listForSeller(Long sellerId, String tab, String noteType, String query);

    ComplianceSellerNote getForSeller(Long noteId);

    void markRead(Long sellerId, Long noteId);

    void markUnread(Long sellerId, Long noteId);

    void markAcknowledged(Long sellerId, Long noteId);

    void markUnacknowledged(Long sellerId, Long noteId);

    long countUnread(Long sellerId);

    long countAcknowledged(Long sellerId);

    Map<Long, Boolean> resolveReadState(Long sellerId, List<Long> noteIds);

    Map<Long, Boolean> resolveAcknowledgedState(Long sellerId, List<Long> noteIds);

    Map<String, Object> buildNoteImpactSummary(Long noteId);

    Map<String, Object> buildAnalyticsSummary(
            String noteType,
            LocalDate fromDate,
            LocalDate toDate,
            Integer minImpactedSellers
    );

    ComplianceSellerNote createAutoDraftFromEvent(
            String eventType,
            Map<String, Object> eventPayload,
            String actorEmail
    );

    List<Map<String, Object>> readAttachments(ComplianceSellerNote note);

    Map<String, Object> getAttachmentForAdmin(Long noteId, String attachmentId);

    Map<String, Object> getAttachmentForSeller(Long sellerId, Long noteId, String attachmentId);

    String getAttachmentUrl(Map<String, Object> attachment);
}
