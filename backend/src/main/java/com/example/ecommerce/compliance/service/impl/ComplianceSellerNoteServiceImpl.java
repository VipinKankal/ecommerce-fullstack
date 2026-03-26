package com.example.ecommerce.compliance.service.impl;

import com.example.ecommerce.admin.request.CreateComplianceSellerNoteRequest;
import com.example.ecommerce.admin.request.UpdateComplianceSellerNoteRequest;
import com.example.ecommerce.compliance.service.ComplianceSellerNoteService;
import com.example.ecommerce.modal.ComplianceSellerNote;
import com.example.ecommerce.modal.ComplianceSellerNoteRead;
import com.example.ecommerce.modal.Seller;
import com.example.ecommerce.repository.ComplianceSellerNoteReadRepository;
import com.example.ecommerce.repository.ComplianceSellerNoteRepository;
import com.example.ecommerce.repository.SellerRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.net.URISyntaxException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

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
    private static final int DEFAULT_MAX_ATTACHMENT_COUNT = 10;
    private static final int DEFAULT_MAX_ATTACHMENT_URL_LENGTH = 2048;
    private static final TypeReference<List<Map<String, Object>>> ATTACHMENT_TYPE = new TypeReference<>() {
    };

    private final ComplianceSellerNoteRepository complianceSellerNoteRepository;
    private final ComplianceSellerNoteReadRepository complianceSellerNoteReadRepository;
    private final SellerRepository sellerRepository;
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
        applyCreatePayload(note, request);
        note.setCreatedBy(trimToNull(actorEmail));
        note.setUpdatedBy(trimToNull(actorEmail));
        applyStatusTransition(note, note.getStatus(), false);
        return complianceSellerNoteRepository.save(note);
    }

    @Override
    @Transactional
    public ComplianceSellerNote update(Long noteId, UpdateComplianceSellerNoteRequest request, String actorEmail) {
        ComplianceSellerNote note = getForAdmin(noteId);
        applyUpdatePayload(note, request);
        note.setUpdatedBy(trimToNull(actorEmail));
        applyStatusTransition(note, note.getStatus(), false);
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
        applyStatusTransition(note, "PUBLISHED", true);
        return complianceSellerNoteRepository.save(note);
    }

    @Override
    @Transactional
    public ComplianceSellerNote archive(Long noteId, String actorEmail) {
        ComplianceSellerNote note = getForAdmin(noteId);
        note.setStatus("ARCHIVED");
        note.setUpdatedBy(trimToNull(actorEmail));
        applyStatusTransition(note, "ARCHIVED", true);
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
        ComplianceSellerNote note = getForSeller(noteId);
        Seller seller = getSeller(sellerId);
        ComplianceSellerNoteRead readEntry = complianceSellerNoteReadRepository
                .findBySeller_IdAndNote_Id(seller.getId(), note.getId())
                .orElseGet(ComplianceSellerNoteRead::new);
        readEntry.setNote(note);
        readEntry.setSeller(seller);
        readEntry.setRead(true);
        readEntry.setReadAt(LocalDateTime.now());
        readEntry.setUnreadAt(null);
        complianceSellerNoteReadRepository.save(readEntry);
    }

    @Override
    @Transactional
    public void markUnread(Long sellerId, Long noteId) {
        ComplianceSellerNote note = getForSeller(noteId);
        Seller seller = getSeller(sellerId);
        ComplianceSellerNoteRead readEntry = complianceSellerNoteReadRepository
                .findBySeller_IdAndNote_Id(seller.getId(), note.getId())
                .orElseGet(ComplianceSellerNoteRead::new);
        readEntry.setNote(note);
        readEntry.setSeller(seller);
        readEntry.setRead(false);
        readEntry.setUnreadAt(LocalDateTime.now());
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
    public Map<Long, Boolean> resolveReadState(Long sellerId, List<Long> noteIds) {
        if (noteIds == null || noteIds.isEmpty()) {
            return Map.of();
        }

        Map<Long, Boolean> result = noteIds.stream()
                .collect(Collectors.toMap(id -> id, id -> false, (a, b) -> a, HashMap::new));
        complianceSellerNoteReadRepository.findBySeller_IdAndNote_IdIn(sellerId, noteIds)
                .forEach(entry -> result.put(entry.getNote().getId(), entry.isRead()));
        return result;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Map<String, Object>> readAttachments(ComplianceSellerNote note) {
        if (note == null || note.getAttachmentsJson() == null || note.getAttachmentsJson().isBlank()) {
            return List.of();
        }
        try {
            List<Map<String, Object>> parsed = objectMapper.readValue(
                    note.getAttachmentsJson(),
                    ATTACHMENT_TYPE
            );
            if (parsed == null) {
                return List.of();
            }
            return sanitizeAttachments(parsed, false);
        } catch (JsonProcessingException ex) {
            return List.of();
        }
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
        getSeller(sellerId);
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

    private Seller getSeller(Long sellerId) {
        return sellerRepository.findById(sellerId)
                .orElseThrow(() -> new IllegalArgumentException("Seller not found"));
    }

    private void applyCreatePayload(ComplianceSellerNote note, CreateComplianceSellerNoteRequest request) {
        validateRequest(request);
        note.setTitle(trimRequired(request.getTitle(), "Title is required"));
        note.setNoteType(normalizeRequired(request.getNoteType(), ALLOWED_TYPES, "Unsupported note type"));
        note.setPriority(normalizeRequired(request.getPriority(), ALLOWED_PRIORITIES, "Unsupported note priority"));
        note.setShortSummary(trimRequired(request.getShortSummary(), "Short summary is required"));
        note.setFullNote(trimRequired(request.getFullNote(), "Full note is required"));
        note.setEffectiveDate(request.getEffectiveDate());
        note.setActionRequired(trimToNull(request.getActionRequired()));
        note.setAffectedCategory(trimToNull(request.getAffectedCategory()));
        note.setBusinessEmail(trimRequired(request.getBusinessEmail(), "Business email is required"));
        note.setPinned(Boolean.TRUE.equals(request.getPinned()));
        note.setSourceMode(normalizeWithFallback(request.getSourceMode(), "MANUAL", ALLOWED_SOURCE_MODES, "Unsupported source mode"));
        note.setStatus(normalizeWithFallback(request.getStatus(), "DRAFT", ALLOWED_STATUSES, "Unsupported note status"));
        note.setAttachmentsJson(writeAttachments(request.getAttachments()));
    }

    private void applyUpdatePayload(ComplianceSellerNote note, UpdateComplianceSellerNoteRequest request) {
        validateRequest(request);
        note.setTitle(trimRequired(request.getTitle(), "Title is required"));
        note.setNoteType(normalizeRequired(request.getNoteType(), ALLOWED_TYPES, "Unsupported note type"));
        note.setPriority(normalizeRequired(request.getPriority(), ALLOWED_PRIORITIES, "Unsupported note priority"));
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
                ALLOWED_SOURCE_MODES,
                "Unsupported source mode"
        ));
        note.setStatus(normalizeWithFallback(
                request.getStatus(),
                note.getStatus() == null ? "DRAFT" : note.getStatus(),
                ALLOWED_STATUSES,
                "Unsupported note status"
        ));
        note.setAttachmentsJson(writeAttachments(request.getAttachments()));
    }

    private void validateRequest(CreateComplianceSellerNoteRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Compliance note payload is required");
        }
    }

    private void validateRequest(UpdateComplianceSellerNoteRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Compliance note payload is required");
        }
    }

    private void applyStatusTransition(ComplianceSellerNote note, String status, boolean forceTimestamp) {
        String normalizedStatus = normalizeWithFallback(status, "DRAFT", ALLOWED_STATUSES, "Unsupported note status");
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

    private boolean containsQuery(ComplianceSellerNote note, String normalizedQuery) {
        if (normalizedQuery == null) {
            return true;
        }
        return lower(note.getTitle()).contains(normalizedQuery)
                || lower(note.getShortSummary()).contains(normalizedQuery)
                || lower(note.getFullNote()).contains(normalizedQuery);
    }

    private Comparator<ComplianceSellerNote> noteComparator() {
        return Comparator
                .comparing(ComplianceSellerNote::isPinned).reversed()
                .thenComparing(this::resolveSortDate, Comparator.nullsLast(Comparator.reverseOrder()));
    }

    private LocalDateTime resolveSortDate(ComplianceSellerNote note) {
        if (note.getPublishedAt() != null) {
            return note.getPublishedAt();
        }
        if (note.getUpdatedAt() != null) {
            return note.getUpdatedAt();
        }
        return note.getCreatedAt();
    }

    private String writeAttachments(List<Map<String, Object>> attachments) {
        List<Map<String, Object>> safeAttachments = sanitizeAttachments(
                attachments == null ? List.of() : new ArrayList<>(attachments),
                true
        );
        try {
            return objectMapper.writeValueAsString(safeAttachments);
        } catch (JsonProcessingException ex) {
            throw new IllegalArgumentException("Invalid attachments payload");
        }
    }

    private String normalizeTab(String tab) {
        String normalized = normalizeNullable(tab);
        if (normalized == null) {
            return "LATEST";
        }
        if (!Set.of("LATEST", "UNREAD", "ARCHIVED").contains(normalized)) {
            throw new IllegalArgumentException("Unsupported notes tab");
        }
        return normalized;
    }

    private String normalizeQuery(String query) {
        if (query == null) {
            return null;
        }
        String trimmed = query.trim().toLowerCase(Locale.ROOT);
        return trimmed.isBlank() ? null : trimmed;
    }

    private String normalizeRequired(String value, Set<String> allowed, String errorMessage) {
        String normalized = normalizeNullable(value);
        if (normalized == null) {
            throw new IllegalArgumentException(errorMessage);
        }
        assertAllowed(normalized, allowed, errorMessage);
        return normalized;
    }

    private String normalizeWithFallback(String value, String fallback, Set<String> allowed, String errorMessage) {
        String normalized = normalizeNullable(value);
        String resolved = normalized == null ? normalizeNullable(fallback) : normalized;
        if (resolved == null) {
            throw new IllegalArgumentException(errorMessage);
        }
        assertAllowed(resolved, allowed, errorMessage);
        return resolved;
    }

    private void assertAllowed(String value, Set<String> allowed, String errorMessage) {
        if (!allowed.contains(value)) {
            throw new IllegalArgumentException(errorMessage);
        }
    }

    private String trimRequired(String value, String errorMessage) {
        String trimmed = trimToNull(value);
        if (trimmed == null) {
            throw new IllegalArgumentException(errorMessage);
        }
        return trimmed;
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isBlank() ? null : trimmed;
    }

    private String normalizeNullable(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isBlank() ? null : trimmed.toUpperCase(Locale.ROOT);
    }

    private String lower(String value) {
        return value == null ? "" : value.toLowerCase(Locale.ROOT);
    }

    private List<Map<String, Object>> sanitizeAttachments(
            Collection<Map<String, Object>> attachments,
            boolean strict
    ) {
        List<Map<String, Object>> rawItems =
                attachments == null ? List.of() : new ArrayList<>(attachments);
        if (rawItems.isEmpty()) {
            return List.of();
        }

        int maxCount = maxAttachmentCount > 0 ? maxAttachmentCount : DEFAULT_MAX_ATTACHMENT_COUNT;
        if (strict && rawItems.size() > maxCount) {
            throw new IllegalArgumentException("Attachment count exceeds allowed limit");
        }

        List<Map<String, Object>> sanitized = new ArrayList<>();
        for (Map<String, Object> rawAttachment : rawItems) {
            try {
                Map<String, Object> item = sanitizeSingleAttachment(rawAttachment, strict);
                if (item != null) {
                    sanitized.add(item);
                }
            } catch (IllegalArgumentException ex) {
                if (strict) {
                    throw ex;
                }
            }
        }
        return sanitized;
    }

    private Map<String, Object> sanitizeSingleAttachment(
            Map<String, Object> rawAttachment,
            boolean strict
    ) {
        if (rawAttachment == null) {
            if (strict) {
                throw new IllegalArgumentException("Attachment entry is required");
            }
            return null;
        }

        String name = sanitizeAttachmentName(rawAttachment.get("name"));
        String uploadedAt = trimToNull(rawAttachment.get("uploadedAt") == null
                ? null
                : String.valueOf(rawAttachment.get("uploadedAt")));
        String urlRaw = rawAttachment.get("url") == null ? null : String.valueOf(rawAttachment.get("url"));
        String attachmentId = sanitizeAttachmentId(
                rawAttachment.get("id") == null ? null : String.valueOf(rawAttachment.get("id"))
        );

        if (name == null || urlRaw == null) {
            if (strict) {
                throw new IllegalArgumentException("Attachment name and url are required");
            }
            return null;
        }

        String safeUrl = normalizeAndValidateAttachmentUrl(urlRaw);
        String safeId = attachmentId == null
                ? "att_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16)
                : attachmentId;

        Map<String, Object> item = new LinkedHashMap<>();
        item.put("id", safeId);
        item.put("name", name);
        item.put("url", safeUrl);
        if (uploadedAt != null) {
            item.put("uploadedAt", uploadedAt);
        }
        return item;
    }

    private String sanitizeAttachmentName(Object value) {
        String raw = value == null ? null : trimToNull(String.valueOf(value));
        if (raw == null) {
            return null;
        }
        if (raw.length() > 200) {
            throw new IllegalArgumentException("Attachment name exceeds allowed length");
        }
        for (int index = 0; index < raw.length(); index++) {
            if (Character.isISOControl(raw.charAt(index))) {
                throw new IllegalArgumentException("Attachment name contains invalid characters");
            }
        }
        return raw;
    }

    private String sanitizeAttachmentId(String value) {
        String raw = trimToNull(value);
        if (raw == null) {
            return null;
        }
        if (!raw.matches("^[A-Za-z0-9_-]{1,64}$")) {
            return null;
        }
        return raw;
    }

    private String normalizeAndValidateAttachmentUrl(String rawUrl) {
        String candidate = trimToNull(rawUrl);
        if (candidate == null) {
            throw new IllegalArgumentException("Attachment URL is required");
        }
        int maxUrlLength = maxAttachmentUrlLength > 0
                ? maxAttachmentUrlLength
                : DEFAULT_MAX_ATTACHMENT_URL_LENGTH;
        if (candidate.length() > maxUrlLength) {
            throw new IllegalArgumentException("Attachment URL exceeds allowed length");
        }

        URI uri;
        try {
            uri = new URI(candidate);
        } catch (URISyntaxException ex) {
            throw new IllegalArgumentException("Attachment URL is invalid");
        }

        if (!"https".equalsIgnoreCase(uri.getScheme())) {
            throw new IllegalArgumentException("Attachment URL must use HTTPS");
        }
        if (uri.getUserInfo() != null) {
            throw new IllegalArgumentException("Attachment URL userinfo is not allowed");
        }
        if (uri.getHost() == null || uri.getHost().isBlank()) {
            throw new IllegalArgumentException("Attachment URL host is required");
        }

        String host = uri.getHost().toLowerCase(Locale.ROOT);
        if ("localhost".equals(host) || host.endsWith(".local")) {
            throw new IllegalArgumentException("Attachment URL host is not allowed");
        }
        if (!isAttachmentHostAllowed(host)) {
            throw new IllegalArgumentException("Attachment URL host is not in allowed list");
        }

        try {
            URI normalized = new URI(
                    uri.getScheme().toLowerCase(Locale.ROOT),
                    uri.getAuthority(),
                    uri.getPath(),
                    uri.getQuery(),
                    null
            );
            return normalized.toASCIIString();
        } catch (URISyntaxException ex) {
            throw new IllegalArgumentException("Attachment URL normalization failed");
        }
    }

    private boolean isAttachmentHostAllowed(String host) {
        Set<String> allowList = parseAllowedHosts();
        for (String rule : allowList) {
            if (rule.startsWith("*.")) {
                String suffix = rule.substring(2);
                if (host.equals(suffix) || host.endsWith("." + suffix)) {
                    return true;
                }
                continue;
            }
            if (rule.startsWith(".")) {
                String suffix = rule.substring(1);
                if (host.equals(suffix) || host.endsWith("." + suffix)) {
                    return true;
                }
                continue;
            }
            if (host.equals(rule)) {
                return true;
            }
        }
        return false;
    }

    private Set<String> parseAllowedHosts() {
        String raw = trimToNull(allowedAttachmentHosts);
        if (raw == null) {
            return Set.of("res.cloudinary.com", "*.cloudinary.com");
        }
        Set<String> parsed = raw.lines()
                .flatMap(line -> List.of(line.split(",")).stream())
                .map(value -> value == null ? "" : value.trim().toLowerCase(Locale.ROOT))
                .filter(value -> !value.isBlank())
                .collect(Collectors.toSet());
        if (parsed.isEmpty()) {
            return Set.of("res.cloudinary.com", "*.cloudinary.com");
        }
        return parsed;
    }
}
