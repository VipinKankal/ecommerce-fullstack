package com.example.ecommerce.compliance.service.impl;

import com.example.ecommerce.admin.request.CreateComplianceSellerNoteRequest;
import com.example.ecommerce.admin.request.UpdateComplianceSellerNoteRequest;
import com.example.ecommerce.compliance.service.ComplianceSellerNoteService;
import com.example.ecommerce.modal.ComplianceSellerNote;
import com.example.ecommerce.modal.ComplianceSellerNoteRead;
import com.example.ecommerce.repository.ComplianceSellerNoteReadRepository;
import com.example.ecommerce.repository.ComplianceSellerNoteRepository;
import com.example.ecommerce.repository.ProductRepository;
import com.example.ecommerce.repository.SellerRepository;
import tools.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class ComplianceSellerNoteServiceImpl implements ComplianceSellerNoteService {

    private static final Set<String> ALLOWED_TYPES = Set.of(
            "GST",
            "HSN",
            "TCS",
            "POLICY",
            "CAMPAIGN",
            "WARNING",
            "GENERAL"
    );
    private static final Set<String> ALLOWED_PRIORITIES = Set.of("LOW", "MEDIUM", "HIGH", "CRITICAL");
    private static final Set<String> ALLOWED_STATUSES = Set.of("DRAFT", "PUBLISHED", "ARCHIVED");
    private static final Set<String> ALLOWED_SOURCE_MODES = Set.of("MANUAL", "AUTO_DRAFT");
    private final ComplianceSellerNoteRepository complianceSellerNoteRepository;
    private final ComplianceSellerNoteReadRepository complianceSellerNoteReadRepository;
    private final SellerRepository sellerRepository;
    private final ProductRepository productRepository;
    private final ObjectMapper objectMapper;

    @Value("${app.compliance.attachments.allowed-hosts:res.cloudinary.com,*.cloudinary.com}")
    private String allowedAttachmentHosts;

    @Value("${app.compliance.attachments.max-count:10}")
    private int maxAttachmentCount;

    @Value("${app.compliance.attachments.max-url-length:2048}")
    private int maxAttachmentUrlLength;

    @Override
    @Transactional(readOnly = true)
    public List<ComplianceSellerNote> listForAdmin(String status, String noteType, String query) {
        String normalizedStatusCandidate = normalizeNullable(status);
        String normalizedTypeCandidate = normalizeNullable(noteType);
        if ("ALL".equals(normalizedStatusCandidate)) {
            normalizedStatusCandidate = null;
        }
        if ("ALL".equals(normalizedTypeCandidate)) {
            normalizedTypeCandidate = null;
        }
        final String normalizedStatus = normalizedStatusCandidate;
        final String normalizedType = normalizedTypeCandidate;
        String normalizedQuery = normalizeQuery(query);
        if (normalizedStatus != null) {
            assertAllowed(normalizedStatus, ALLOWED_STATUSES, "Unsupported note status");
        }
        if (normalizedType != null) {
            assertAllowed(normalizedType, ALLOWED_TYPES, "Unsupported note type");
        }

        return complianceSellerNoteRepository.findAll().stream()
                .filter(note -> normalizedStatus == null || normalizedStatus.equals(note.getStatus()))
                .filter(note -> normalizedType == null || normalizedType.equals(note.getNoteType()))
                .filter(note -> containsQuery(note, normalizedQuery))
                .sorted(noteComparator())
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ComplianceSellerNote getForAdmin(Long noteId) {
        return complianceSellerNoteRepository.findById(noteId)
                .orElseThrow(() -> new IllegalArgumentException("Compliance note not found"));
    }

    @Override
    @Transactional
    public ComplianceSellerNote create(CreateComplianceSellerNoteRequest request, String actorEmail) {
        ComplianceSellerNote note = new ComplianceSellerNote();
        ComplianceSellerNoteRequestSupport.applyCreatePayload(
                note,
                request,
                objectMapper,
                ALLOWED_TYPES,
                ALLOWED_PRIORITIES,
                ALLOWED_STATUSES,
                ALLOWED_SOURCE_MODES,
                allowedAttachmentHosts,
                maxAttachmentCount,
                maxAttachmentUrlLength
        );
        note.setCreatedBy(trimToNull(actorEmail));
        note.setUpdatedBy(trimToNull(actorEmail));
        ComplianceSellerNoteRequestSupport.applyStatusTransition(note, note.getStatus(), false, ALLOWED_STATUSES);
        return complianceSellerNoteRepository.save(note);
    }

    @Override
    @Transactional
    public ComplianceSellerNote update(Long noteId, UpdateComplianceSellerNoteRequest request, String actorEmail) {
        ComplianceSellerNote note = getForAdmin(noteId);
        ComplianceSellerNoteRequestSupport.applyUpdatePayload(
                note,
                request,
                objectMapper,
                ALLOWED_TYPES,
                ALLOWED_PRIORITIES,
                ALLOWED_STATUSES,
                ALLOWED_SOURCE_MODES,
                allowedAttachmentHosts,
                maxAttachmentCount,
                maxAttachmentUrlLength,
                readAttachments(note)
        );
        note.setUpdatedBy(trimToNull(actorEmail));
        ComplianceSellerNoteRequestSupport.applyStatusTransition(note, note.getStatus(), false, ALLOWED_STATUSES);
        return complianceSellerNoteRepository.save(note);
    }

    @Override
    @Transactional
    public void delete(Long noteId) {
        complianceSellerNoteRepository.delete(getForAdmin(noteId));
    }

    @Override
    @Transactional
    public ComplianceSellerNote publish(Long noteId, String actorEmail) {
        ComplianceSellerNote note = getForAdmin(noteId);
        note.setStatus("PUBLISHED");
        note.setUpdatedBy(trimToNull(actorEmail));
        ComplianceSellerNoteRequestSupport.applyStatusTransition(note, "PUBLISHED", true, ALLOWED_STATUSES);
        return complianceSellerNoteRepository.save(note);
    }

    @Override
    @Transactional
    public ComplianceSellerNote archive(Long noteId, String actorEmail) {
        ComplianceSellerNote note = getForAdmin(noteId);
        note.setStatus("ARCHIVED");
        note.setUpdatedBy(trimToNull(actorEmail));
        ComplianceSellerNoteRequestSupport.applyStatusTransition(note, "ARCHIVED", true, ALLOWED_STATUSES);
        return complianceSellerNoteRepository.save(note);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ComplianceSellerNote> listForSeller(
            Long sellerId,
            String tab,
            String noteType,
            String query
    ) {
        String normalizedTab = normalizeTab(tab);
        String normalizedTypeCandidate = normalizeNullable(noteType);
        if ("ALL".equals(normalizedTypeCandidate)) {
            normalizedTypeCandidate = null;
        }
        final String normalizedType = normalizedTypeCandidate;
        if (normalizedType != null) {
            assertAllowed(normalizedType, ALLOWED_TYPES, "Unsupported note type");
        }

        String normalizedQuery = normalizeQuery(query);
        List<ComplianceSellerNote> baseNotes = complianceSellerNoteRepository.findAll().stream()
                .filter(note -> {
                    if ("ARCHIVED".equals(normalizedTab)) {
                        return "ARCHIVED".equals(note.getStatus());
                    }
                    return "PUBLISHED".equals(note.getStatus());
                })
                .filter(note -> normalizedType == null || normalizedType.equals(note.getNoteType()))
                .filter(note -> containsQuery(note, normalizedQuery))
                .sorted(noteComparator())
                .toList();

        if (!"UNREAD".equals(normalizedTab)) {
            return baseNotes;
        }

        Map<Long, Boolean> readMap = resolveReadState(
                sellerId,
                baseNotes.stream().map(ComplianceSellerNote::getId).toList()
        );
        return baseNotes.stream()
                .filter(note -> !readMap.getOrDefault(note.getId(), false))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ComplianceSellerNote getForSeller(Long noteId) {
        ComplianceSellerNote note = complianceSellerNoteRepository.findById(noteId)
                .orElseThrow(() -> new IllegalArgumentException("Compliance note not found"));
        if ("DRAFT".equals(note.getStatus())) {
            throw new IllegalArgumentException("Draft notes are not visible to sellers");
        }
        return note;
    }

    @Override
    @Transactional
    public void markRead(Long sellerId, Long noteId) {
        ComplianceSellerNoteRead readEntry = ComplianceSellerNoteRequestSupport.getOrCreateReadEntry(
                sellerId,
                noteId,
                complianceSellerNoteRepository,
                complianceSellerNoteReadRepository,
                sellerRepository
        );
        readEntry.setRead(true);
        readEntry.setReadAt(java.time.LocalDateTime.now());
        readEntry.setUnreadAt(null);
        complianceSellerNoteReadRepository.save(readEntry);
    }

    @Override
    @Transactional
    public void markUnread(Long sellerId, Long noteId) {
        ComplianceSellerNoteRead readEntry = ComplianceSellerNoteRequestSupport.getOrCreateReadEntry(
                sellerId,
                noteId,
                complianceSellerNoteRepository,
                complianceSellerNoteReadRepository,
                sellerRepository
        );
        readEntry.setRead(false);
        readEntry.setUnreadAt(java.time.LocalDateTime.now());
        complianceSellerNoteReadRepository.save(readEntry);
    }

    @Override
    @Transactional
    public void markAcknowledged(Long sellerId, Long noteId) {
        ComplianceSellerNoteRead readEntry = ComplianceSellerNoteRequestSupport.getOrCreateReadEntry(
                sellerId,
                noteId,
                complianceSellerNoteRepository,
                complianceSellerNoteReadRepository,
                sellerRepository
        );
        if (!readEntry.isRead()) {
            readEntry.setRead(true);
            readEntry.setReadAt(java.time.LocalDateTime.now());
            readEntry.setUnreadAt(null);
        }
        readEntry.setAcknowledged(true);
        readEntry.setAcknowledgedAt(java.time.LocalDateTime.now());
        readEntry.setUnacknowledgedAt(null);
        complianceSellerNoteReadRepository.save(readEntry);
    }

    @Override
    @Transactional
    public void markUnacknowledged(Long sellerId, Long noteId) {
        ComplianceSellerNoteRead readEntry = ComplianceSellerNoteRequestSupport.getOrCreateReadEntry(
                sellerId,
                noteId,
                complianceSellerNoteRepository,
                complianceSellerNoteReadRepository,
                sellerRepository
        );
        readEntry.setAcknowledged(false);
        readEntry.setUnacknowledgedAt(java.time.LocalDateTime.now());
        complianceSellerNoteReadRepository.save(readEntry);
    }

    @Override
    @Transactional(readOnly = true)
    public long countUnread(Long sellerId) {
        List<ComplianceSellerNote> publishedNotes = complianceSellerNoteRepository.findAll().stream()
                .filter(note -> "PUBLISHED".equals(note.getStatus()))
                .toList();
        if (publishedNotes.isEmpty()) {
            return 0;
        }
        Map<Long, Boolean> readMap = resolveReadState(
                sellerId,
                publishedNotes.stream().map(ComplianceSellerNote::getId).toList()
        );
        return publishedNotes.stream()
                .filter(note -> !readMap.getOrDefault(note.getId(), false))
                .count();
    }

    @Override
    @Transactional(readOnly = true)
    public long countAcknowledged(Long sellerId) {
        return complianceSellerNoteReadRepository.countBySeller_IdAndAcknowledgedTrue(sellerId);
    }

    @Override
    @Transactional(readOnly = true)
    public Map<Long, Boolean> resolveReadState(Long sellerId, List<Long> noteIds) {
        return ComplianceSellerNoteAnalyticsSupport.resolveStateMap(
                sellerId,
                noteIds,
                complianceSellerNoteReadRepository,
                ComplianceSellerNoteRead::isRead
        );
    }

    @Override
    @Transactional(readOnly = true)
    public Map<Long, Boolean> resolveAcknowledgedState(Long sellerId, List<Long> noteIds) {
        return ComplianceSellerNoteAnalyticsSupport.resolveStateMap(
                sellerId,
                noteIds,
                complianceSellerNoteReadRepository,
                ComplianceSellerNoteRead::isAcknowledged
        );
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> buildNoteImpactSummary(Long noteId) {
        ComplianceSellerNote note = getForAdmin(noteId);
        return ComplianceSellerNoteAnalyticsSupport.buildNoteImpactSummary(
                note,
                productRepository,
                complianceSellerNoteReadRepository,
                sellerRepository
        );
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> buildAnalyticsSummary(
            String noteType,
            LocalDate fromDate,
            LocalDate toDate,
            Integer minImpactedSellers
    ) {
        return ComplianceSellerNoteAnalyticsSupport.buildAnalyticsSummary(
                noteType,
                fromDate,
                toDate,
                minImpactedSellers,
                ALLOWED_TYPES,
                complianceSellerNoteRepository,
                complianceSellerNoteReadRepository,
                sellerRepository,
                productRepository
        );
    }

    @Override
    @Transactional
    public ComplianceSellerNote createAutoDraftFromEvent(
            String eventType,
            Map<String, Object> eventPayload,
            String actorEmail
    ) {
        ComplianceSellerNote note = ComplianceSellerNoteRequestSupport.createAutoDraftNote(
                eventType,
                eventPayload,
                actorEmail,
                ALLOWED_TYPES,
                ALLOWED_PRIORITIES,
                ALLOWED_STATUSES,
                objectMapper,
                allowedAttachmentHosts,
                maxAttachmentCount,
                maxAttachmentUrlLength
        );
        return complianceSellerNoteRepository.save(note);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Map<String, Object>> readAttachments(ComplianceSellerNote note) {
        return ComplianceSellerNoteAttachmentSupport.readAttachments(
                note == null ? null : note.getAttachmentsJson(),
                objectMapper,
                allowedAttachmentHosts,
                maxAttachmentCount,
                maxAttachmentUrlLength
        );
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getAttachmentForAdmin(Long noteId, String attachmentId) {
        ComplianceSellerNote note = getForAdmin(noteId);
        return findAttachment(note, attachmentId);
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getAttachmentForSeller(Long sellerId, Long noteId, String attachmentId) {
        ComplianceSellerNoteRequestSupport.getSeller(sellerId, sellerRepository);
        ComplianceSellerNote note = getForSeller(noteId);
        return findAttachment(note, attachmentId);
    }

    @Override
    public String getAttachmentUrl(Map<String, Object> attachment) {
        if (attachment == null || attachment.get("url") == null) {
            throw new IllegalArgumentException("Attachment URL is missing");
        }
        return normalizeAndValidateAttachmentUrl(String.valueOf(attachment.get("url")));
    }

    private Map<String, Object> findAttachment(ComplianceSellerNote note, String attachmentId) {
        String normalizedAttachmentId = sanitizeAttachmentId(attachmentId);
        if (normalizedAttachmentId == null) {
            throw new IllegalArgumentException("Attachment id is required");
        }
        return readAttachments(note).stream()
                .filter(item -> normalizedAttachmentId.equals(String.valueOf(item.get("id"))))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Attachment not found"));
    }

    private boolean containsQuery(ComplianceSellerNote note, String normalizedQuery) {
        return ComplianceSellerNoteValueSupport.containsQuery(note, normalizedQuery);
    }

    private boolean isWithinAnalyticsPeriod(
            ComplianceSellerNote note,
            LocalDate fromDate,
            LocalDate toDate
    ) {
        return ComplianceSellerNoteValueSupport.isWithinAnalyticsPeriod(note, fromDate, toDate);
    }

    private Comparator<ComplianceSellerNote> noteComparator() {
        return ComplianceSellerNoteValueSupport.noteComparator();
    }

    private String normalizeTab(String tab) {
        return ComplianceSellerNoteValueSupport.normalizeTab(tab);
    }

    private String normalizeQuery(String query) {
        return ComplianceSellerNoteValueSupport.normalizeQuery(query);
    }

    private void assertAllowed(String value, Set<String> allowed, String errorMessage) {
        ComplianceSellerNoteValueSupport.assertAllowed(value, allowed, errorMessage);
    }

    private String trimToNull(String value) {
        return ComplianceSellerNoteValueSupport.trimToNull(value);
    }

    private String normalizeNullable(String value) {
        return ComplianceSellerNoteValueSupport.normalizeNullable(value);
    }

    private String sanitizeAttachmentId(String value) {
        return ComplianceSellerNoteAttachmentSupport.sanitizeAttachmentId(value);
    }

    private String normalizeAndValidateAttachmentUrl(String rawUrl) {
        return ComplianceSellerNoteAttachmentSupport.normalizeAndValidateAttachmentUrl(
                rawUrl,
                allowedAttachmentHosts,
                maxAttachmentUrlLength
        );
    }
}
