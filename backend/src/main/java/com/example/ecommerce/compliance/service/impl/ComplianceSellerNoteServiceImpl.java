package com.example.ecommerce.compliance.service.impl;

import com.example.ecommerce.admin.request.CreateComplianceSellerNoteRequest;
import com.example.ecommerce.admin.request.UpdateComplianceSellerNoteRequest;
import com.example.ecommerce.compliance.service.ComplianceSellerNoteService;
import com.example.ecommerce.modal.ComplianceSellerNote;
import com.example.ecommerce.modal.ComplianceSellerNoteRead;
import com.example.ecommerce.modal.Product;
import com.example.ecommerce.modal.Seller;
import com.example.ecommerce.repository.ComplianceSellerNoteReadRepository;
import com.example.ecommerce.repository.ComplianceSellerNoteRepository;
import com.example.ecommerce.repository.ProductRepository;
import com.example.ecommerce.repository.SellerRepository;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.net.URISyntaxException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
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
        ComplianceSellerNoteRead readEntry = getOrCreateReadEntry(sellerId, noteId);
        readEntry.setRead(true);
        readEntry.setReadAt(LocalDateTime.now());
        readEntry.setUnreadAt(null);
        complianceSellerNoteReadRepository.save(readEntry);
    }

    @Override
    @Transactional
    public void markUnread(Long sellerId, Long noteId) {
        ComplianceSellerNoteRead readEntry = getOrCreateReadEntry(sellerId, noteId);
        readEntry.setRead(false);
        readEntry.setUnreadAt(LocalDateTime.now());
        complianceSellerNoteReadRepository.save(readEntry);
    }

    @Override
    @Transactional
    public void markAcknowledged(Long sellerId, Long noteId) {
        ComplianceSellerNoteRead readEntry = getOrCreateReadEntry(sellerId, noteId);
        if (!readEntry.isRead()) {
            readEntry.setRead(true);
            readEntry.setReadAt(LocalDateTime.now());
            readEntry.setUnreadAt(null);
        }
        readEntry.setAcknowledged(true);
        readEntry.setAcknowledgedAt(LocalDateTime.now());
        readEntry.setUnacknowledgedAt(null);
        complianceSellerNoteReadRepository.save(readEntry);
    }

    @Override
    @Transactional
    public void markUnacknowledged(Long sellerId, Long noteId) {
        ComplianceSellerNoteRead readEntry = getOrCreateReadEntry(sellerId, noteId);
        readEntry.setAcknowledged(false);
        readEntry.setUnacknowledgedAt(LocalDateTime.now());
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
    public Map<Long, Boolean> resolveAcknowledgedState(Long sellerId, List<Long> noteIds) {
        if (noteIds == null || noteIds.isEmpty()) {
            return Map.of();
        }

        Map<Long, Boolean> result = noteIds.stream()
                .collect(Collectors.toMap(id -> id, id -> false, (a, b) -> a, HashMap::new));
        complianceSellerNoteReadRepository.findBySeller_IdAndNote_IdIn(sellerId, noteIds)
                .forEach(entry -> result.put(entry.getNote().getId(), entry.isAcknowledged()));
        return result;
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> buildNoteImpactSummary(Long noteId) {
        ComplianceSellerNote note = getForAdmin(noteId);
        return buildImpactSummary(note);
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> buildAnalyticsSummary(
            String noteType,
            LocalDate fromDate,
            LocalDate toDate,
            Integer minImpactedSellers
    ) {
        String normalizedTypeCandidate = normalizeNullable(noteType);
        if ("ALL".equals(normalizedTypeCandidate)) {
            normalizedTypeCandidate = null;
        }
        final String normalizedType = normalizedTypeCandidate;
        if (normalizedType != null) {
            assertAllowed(normalizedType, ALLOWED_TYPES, "Unsupported note type");
        }
        if (fromDate != null && toDate != null && fromDate.isAfter(toDate)) {
            throw new IllegalArgumentException("fromDate cannot be after toDate");
        }
        int minImpactedSellersSafe = minImpactedSellers == null ? 0 : Math.max(minImpactedSellers, 0);

        List<ComplianceSellerNote> filteredNotes = complianceSellerNoteRepository.findAll().stream()
                .filter(note -> normalizedType == null || normalizedType.equals(note.getNoteType()))
                .filter(note -> isWithinAnalyticsPeriod(note, fromDate, toDate))
                .toList();

        List<ComplianceSellerNote> publishedNotes = filteredNotes.stream()
                .filter(note -> "PUBLISHED".equals(note.getStatus()))
                .toList();
        List<Long> publishedNoteIds = publishedNotes.stream()
                .map(ComplianceSellerNote::getId)
                .filter(Objects::nonNull)
                .toList();
        List<ComplianceSellerNoteRead> readEntries = publishedNoteIds.isEmpty()
                ? List.of()
                : complianceSellerNoteReadRepository.findByNote_IdIn(publishedNoteIds);
        Map<Long, Long> impactedSellersByNote = readEntries.stream()
                .filter(entry -> entry.getNote() != null && entry.getSeller() != null)
                .collect(Collectors.groupingBy(
                        entry -> entry.getNote().getId(),
                        Collectors.collectingAndThen(
                                Collectors.mapping(entry -> entry.getSeller().getId(), Collectors.toSet()),
                                sellerIds -> (long) sellerIds.size()
                        )
                ));

        if (minImpactedSellersSafe > 0) {
            Set<Long> allowedPublishedNoteIds = impactedSellersByNote.entrySet().stream()
                    .filter(entry -> entry.getValue() >= minImpactedSellersSafe)
                    .map(Map.Entry::getKey)
                    .collect(Collectors.toSet());

            publishedNotes = publishedNotes.stream()
                    .filter(note -> allowedPublishedNoteIds.contains(note.getId()))
                    .toList();
            publishedNoteIds = publishedNotes.stream()
                    .map(ComplianceSellerNote::getId)
                    .filter(Objects::nonNull)
                    .toList();
            readEntries = publishedNoteIds.isEmpty()
                    ? List.of()
                    : complianceSellerNoteReadRepository.findByNote_IdIn(publishedNoteIds);
            impactedSellersByNote = readEntries.stream()
                    .filter(entry -> entry.getNote() != null && entry.getSeller() != null)
                    .collect(Collectors.groupingBy(
                            entry -> entry.getNote().getId(),
                            Collectors.collectingAndThen(
                                    Collectors.mapping(entry -> entry.getSeller().getId(), Collectors.toSet()),
                                    sellerIds -> (long) sellerIds.size()
                            )
                    ));

            Set<Long> allowedSet = allowedPublishedNoteIds;
            filteredNotes = filteredNotes.stream()
                    .filter(note -> !"PUBLISHED".equals(note.getStatus()) || allowedSet.contains(note.getId()))
                    .toList();
        }

        long sellerCount = sellerRepository.count();
        long denominator = sellerCount * publishedNotes.size();
        long acknowledgedCount = readEntries.stream().filter(ComplianceSellerNoteRead::isAcknowledged).count();
        long readCount = readEntries.stream().filter(ComplianceSellerNoteRead::isRead).count();
        double acknowledgementRate = denominator <= 0
                ? 0.0
                : roundPercentage((acknowledgedCount * 100.0) / denominator);
        double readRate = denominator <= 0
                ? 0.0
                : roundPercentage((readCount * 100.0) / denominator);

        List<Product> products = productRepository.findAll();
        final Map<Long, Long> impactedSellersByNoteFinal = impactedSellersByNote;
        List<Map<String, Object>> impactTopNotes = publishedNotes.stream()
                .sorted(noteComparator())
                .limit(8)
                .map(note -> {
                    Map<String, Object> impact = buildImpactSummary(note, products);
                    impact.put("noteId", note.getId());
                    impact.put("title", note.getTitle());
                    impact.put("noteType", note.getNoteType());
                    impact.put("priority", note.getPriority());
                    impact.put("impactedSellerCount", impactedSellersByNoteFinal.getOrDefault(note.getId(), 0L));
                    return impact;
                })
                .toList();

        Map<String, Long> byType = filteredNotes.stream()
                .collect(Collectors.groupingBy(ComplianceSellerNote::getNoteType, Collectors.counting()));
        Map<String, Long> byPriority = filteredNotes.stream()
                .collect(Collectors.groupingBy(ComplianceSellerNote::getPriority, Collectors.counting()));

        LinkedHashMap<String, Object> summary = new LinkedHashMap<>();
        summary.put("totalNotes", filteredNotes.size());
        summary.put("draftCount", filteredNotes.stream().filter(note -> "DRAFT".equals(note.getStatus())).count());
        summary.put("publishedCount", publishedNotes.size());
        summary.put("archivedCount", filteredNotes.stream().filter(note -> "ARCHIVED".equals(note.getStatus())).count());
        summary.put("highPriorityCount", filteredNotes.stream()
                .filter(note -> "HIGH".equals(note.getPriority()) || "CRITICAL".equals(note.getPriority()))
                .count());
        summary.put("sellerCount", sellerCount);
        summary.put("readRatePercentage", readRate);
        summary.put("acknowledgementRatePercentage", acknowledgementRate);
        summary.put("byType", byType);
        summary.put("byPriority", byPriority);
        summary.put("impactTopNotes", impactTopNotes);
        return summary;
    }

    @Override
    @Transactional
    public ComplianceSellerNote createAutoDraftFromEvent(
            String eventType,
            Map<String, Object> eventPayload,
            String actorEmail
    ) {
        String normalizedEventType = trimToNull(eventType);
        if (normalizedEventType == null) {
            throw new IllegalArgumentException("Event type is required");
        }

        Map<String, Object> payload = eventPayload == null ? Map.of() : eventPayload;
        String noteType = normalizeWithFallback(valueAsString(payload, "noteType"), "POLICY", ALLOWED_TYPES, "Unsupported note type");
        String priority = normalizeWithFallback(valueAsString(payload, "priority"), "HIGH", ALLOWED_PRIORITIES, "Unsupported note priority");
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
        note.setAttachmentsJson(writeAttachments(List.of()));
        note.setCreatedBy(trimToNull(actorEmail) == null ? "system_auto_draft" : trimToNull(actorEmail));
        note.setUpdatedBy(note.getCreatedBy());
        applyStatusTransition(note, "DRAFT", false);
        return complianceSellerNoteRepository.save(note);
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
        } catch (Exception ex) {
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

    private ComplianceSellerNoteRead getOrCreateReadEntry(Long sellerId, Long noteId) {
        ComplianceSellerNote note = getForSeller(noteId);
        Seller seller = getSeller(sellerId);
        ComplianceSellerNoteRead readEntry = complianceSellerNoteReadRepository
                .findBySeller_IdAndNote_Id(seller.getId(), note.getId())
                .orElseGet(ComplianceSellerNoteRead::new);
        readEntry.setNote(note);
        readEntry.setSeller(seller);
        return readEntry;
    }

    private Seller getSeller(Long sellerId) {
        return sellerRepository.findById(sellerId)
                .orElseThrow(() -> new IllegalArgumentException("Seller not found"));
    }

    private Map<String, Object> buildImpactSummary(ComplianceSellerNote note) {
        return buildImpactSummary(note, productRepository.findAll());
    }

    private Map<String, Object> buildImpactSummary(ComplianceSellerNote note, List<Product> products) {
        String normalizedCategory = normalizeCategoryKey(note == null ? null : note.getAffectedCategory());
        List<Product> impactedProducts = (products == null ? List.<Product>of() : products).stream()
                .filter(product -> product != null && isProductImpacted(product, normalizedCategory))
                .sorted(Comparator.comparing(Product::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .toList();
        long acknowledgedCount = 0;
        long readCount = 0;
        long impactedSellerCount = 0;
        long sellerCount = sellerRepository.count();
        if (note != null && note.getId() != null) {
            List<ComplianceSellerNoteRead> entries = complianceSellerNoteReadRepository.findByNote_IdIn(List.of(note.getId()));
            acknowledgedCount = entries.stream().filter(ComplianceSellerNoteRead::isAcknowledged).count();
            readCount = entries.stream().filter(ComplianceSellerNoteRead::isRead).count();
            impactedSellerCount = entries.stream()
                    .map(entry -> entry.getSeller() == null ? null : entry.getSeller().getId())
                    .filter(Objects::nonNull)
                    .distinct()
                    .count();
        }
        double acknowledgementRate = sellerCount <= 0
                ? 0.0
                : roundPercentage((acknowledgedCount * 100.0) / sellerCount);
        double readRate = sellerCount <= 0
                ? 0.0
                : roundPercentage((readCount * 100.0) / sellerCount);

        List<Map<String, Object>> topProducts = impactedProducts.stream()
                .limit(12)
                .map(product -> {
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("id", product.getId());
                    item.put("title", product.getTitle());
                    item.put("uiCategoryKey", product.getUiCategoryKey());
                    item.put("subcategoryKey", product.getSubcategoryKey());
                    item.put("active", product.isActive());
                    return item;
                })
                .toList();

        LinkedHashMap<String, Object> response = new LinkedHashMap<>();
        response.put("affectedCategory", note == null ? null : note.getAffectedCategory());
        response.put("impactedProductCount", impactedProducts.size());
        response.put("impactedProducts", topProducts);
        response.put("coverageScope", normalizedCategory == null ? "GLOBAL_OR_UNSPECIFIED" : "CATEGORY_FILTERED");
        response.put("acknowledgedCount", acknowledgedCount);
        response.put("impactedSellerCount", impactedSellerCount);
        response.put("acknowledgementRatePercentage", acknowledgementRate);
        response.put("readRatePercentage", readRate);
        return response;
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
        note.setAttachmentsJson(writeAttachments(resolveUpdatedAttachments(note, request.getAttachments())));
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

    private boolean isWithinAnalyticsPeriod(
            ComplianceSellerNote note,
            LocalDate fromDate,
            LocalDate toDate
    ) {
        if (fromDate == null && toDate == null) {
            return true;
        }
        LocalDate anchorDate = resolveAnalyticsAnchorDate(note);
        if (anchorDate == null) {
            return true;
        }
        if (fromDate != null && anchorDate.isBefore(fromDate)) {
            return false;
        }
        return toDate == null || !anchorDate.isAfter(toDate);
    }

    private LocalDate resolveAnalyticsAnchorDate(ComplianceSellerNote note) {
        if (note == null) {
            return null;
        }
        if (note.getPublishedAt() != null) {
            return note.getPublishedAt().toLocalDate();
        }
        if (note.getUpdatedAt() != null) {
            return note.getUpdatedAt().toLocalDate();
        }
        if (note.getCreatedAt() != null) {
            return note.getCreatedAt().toLocalDate();
        }
        return null;
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
        } catch (Exception ex) {
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

    private boolean isProductImpacted(Product product, String normalizedCategory) {
        if (normalizedCategory == null) {
            return true;
        }
        String uiCategory = normalizeCategoryKey(product.getUiCategoryKey());
        String subCategory = normalizeCategoryKey(product.getSubcategoryKey());
        String legacyCategory = normalizeCategoryKey(
                product.getCategory() == null ? null : product.getCategory().getCategoryId()
        );
        return normalizedCategory.equals(uiCategory)
                || normalizedCategory.equals(subCategory)
                || normalizedCategory.equals(legacyCategory);
    }

    private String normalizeCategoryKey(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim().toLowerCase(Locale.ROOT);
        return trimmed.isBlank() ? null : trimmed;
    }

    private String firstNonBlank(String first, String second) {
        String one = trimToNull(first);
        if (one != null) {
            return one;
        }
        return trimToNull(second);
    }

    private String valueAsString(Map<String, Object> payload, String key) {
        if (payload == null || key == null) {
            return null;
        }
        Object value = payload.get(key);
        return value == null ? null : String.valueOf(value);
    }

    private LocalDate valueAsLocalDate(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof LocalDate localDate) {
            return localDate;
        }
        String raw = String.valueOf(value).trim();
        if (raw.isBlank()) {
            return null;
        }
        try {
            return LocalDate.parse(raw);
        } catch (Exception ex) {
            return null;
        }
    }

    private List<Map<String, Object>> resolveUpdatedAttachments(
            ComplianceSellerNote existingNote,
            List<Map<String, Object>> incomingAttachments
    ) {
        if (incomingAttachments == null) {
            return List.of();
        }
        Map<String, String> existingUrlsById = readAttachments(existingNote).stream()
                .filter(item -> item.get("id") != null && item.get("url") != null)
                .collect(Collectors.toMap(
                        item -> String.valueOf(item.get("id")),
                        item -> String.valueOf(item.get("url")),
                        (first, second) -> first,
                        LinkedHashMap::new
                ));
        List<Map<String, Object>> resolved = new ArrayList<>();
        for (Map<String, Object> rawAttachment : incomingAttachments) {
            if (rawAttachment == null) {
                continue;
            }
            LinkedHashMap<String, Object> candidate = new LinkedHashMap<>(rawAttachment);
            String id = candidate.get("id") == null ? null : String.valueOf(candidate.get("id"));
            String rawUrl = candidate.get("url") == null ? null : String.valueOf(candidate.get("url"));
            String normalizedUrl = trimToNull(rawUrl);
            if (normalizedUrl == null || normalizedUrl.startsWith("/api/")) {
                if (id != null && existingUrlsById.containsKey(id)) {
                    candidate.put("url", existingUrlsById.get(id));
                }
            }
            resolved.add(candidate);
        }
        return resolved;
    }

    private double roundPercentage(double value) {
        return Math.round(value * 1000.0) / 1000.0;
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
