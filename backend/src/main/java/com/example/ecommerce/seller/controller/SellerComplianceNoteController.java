package com.example.ecommerce.seller.controller;

import com.example.ecommerce.compliance.service.ComplianceSellerNoteService;
import com.example.ecommerce.modal.ComplianceSellerNote;
import com.example.ecommerce.modal.Seller;
import com.example.ecommerce.seller.response.ComplianceSellerNoteSellerResponse;
import com.example.ecommerce.seller.service.SellerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/seller/compliance/notes")
@PreAuthorize("hasRole('SELLER')")
public class SellerComplianceNoteController {

    private final SellerService sellerService;
    private final ComplianceSellerNoteService complianceSellerNoteService;

    @GetMapping
    public ResponseEntity<List<ComplianceSellerNoteSellerResponse>> listNotes(
            @RequestHeader(value = "Authorization", required = false) String jwt,
            @RequestParam(required = false) String tab,
            @RequestParam(required = false) String noteType,
            @RequestParam(required = false, name = "q") String query
    ) throws Exception {
        Seller seller = sellerService.getSellerProfile(jwt);
        List<ComplianceSellerNote> notes =
                complianceSellerNoteService.listForSeller(seller.getId(), tab, noteType, query);
        Map<Long, Boolean> readMap = complianceSellerNoteService.resolveReadState(
                seller.getId(),
                notes.stream().map(ComplianceSellerNote::getId).toList()
        );
        Map<Long, Boolean> acknowledgedMap = complianceSellerNoteService.resolveAcknowledgedState(
                seller.getId(),
                notes.stream().map(ComplianceSellerNote::getId).toList()
        );
        return ResponseEntity.ok(
                notes.stream()
                        .map(note -> toResponse(
                                note,
                                readMap.getOrDefault(note.getId(), false),
                                acknowledgedMap.getOrDefault(note.getId(), false)
                        ))
                        .toList()
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<ComplianceSellerNoteSellerResponse> getNote(
            @RequestHeader(value = "Authorization", required = false) String jwt,
            @PathVariable Long id
    ) throws Exception {
        Seller seller = sellerService.getSellerProfile(jwt);
        ComplianceSellerNote note = complianceSellerNoteService.getForSeller(id);
        boolean read = complianceSellerNoteService.resolveReadState(
                seller.getId(),
                List.of(note.getId())
        ).getOrDefault(note.getId(), false);
        boolean acknowledged = complianceSellerNoteService.resolveAcknowledgedState(
                seller.getId(),
                List.of(note.getId())
        ).getOrDefault(note.getId(), false);
        return ResponseEntity.ok(toResponse(note, read, acknowledged));
    }

    @GetMapping("/{id}/attachments/{attachmentId}/download")
    public ResponseEntity<Void> downloadAttachment(
            @RequestHeader(value = "Authorization", required = false) String jwt,
            @PathVariable Long id,
            @PathVariable String attachmentId
    ) throws Exception {
        Seller seller = sellerService.getSellerProfile(jwt);
        Map<String, Object> attachment = complianceSellerNoteService.getAttachmentForSeller(
                seller.getId(),
                id,
                attachmentId
        );
        String attachmentUrl = complianceSellerNoteService.getAttachmentUrl(attachment);

        HttpHeaders headers = new HttpHeaders();
        headers.setLocation(URI.create(attachmentUrl));
        headers.setCacheControl("no-store, no-cache, must-revalidate, max-age=0");
        headers.setPragma("no-cache");
        return new ResponseEntity<>(headers, HttpStatus.SEE_OTHER);
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<Map<String, Object>> markRead(
            @RequestHeader(value = "Authorization", required = false) String jwt,
            @PathVariable Long id
    ) throws Exception {
        Seller seller = sellerService.getSellerProfile(jwt);
        complianceSellerNoteService.markRead(seller.getId(), id);
        return ResponseEntity.ok(Map.of("read", true, "noteId", id));
    }

    @PatchMapping("/{id}/unread")
    public ResponseEntity<Map<String, Object>> markUnread(
            @RequestHeader(value = "Authorization", required = false) String jwt,
            @PathVariable Long id
    ) throws Exception {
        Seller seller = sellerService.getSellerProfile(jwt);
        complianceSellerNoteService.markUnread(seller.getId(), id);
        return ResponseEntity.ok(Map.of("read", false, "noteId", id));
    }

    @PatchMapping("/{id}/acknowledge")
    public ResponseEntity<Map<String, Object>> markAcknowledged(
            @RequestHeader(value = "Authorization", required = false) String jwt,
            @PathVariable Long id
    ) throws Exception {
        Seller seller = sellerService.getSellerProfile(jwt);
        complianceSellerNoteService.markAcknowledged(seller.getId(), id);
        return ResponseEntity.ok(Map.of("acknowledged", true, "noteId", id));
    }

    @PatchMapping("/{id}/unacknowledge")
    public ResponseEntity<Map<String, Object>> markUnacknowledged(
            @RequestHeader(value = "Authorization", required = false) String jwt,
            @PathVariable Long id
    ) throws Exception {
        Seller seller = sellerService.getSellerProfile(jwt);
        complianceSellerNoteService.markUnacknowledged(seller.getId(), id);
        return ResponseEntity.ok(Map.of("acknowledged", false, "noteId", id));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Object>> getUnreadCount(
            @RequestHeader(value = "Authorization", required = false) String jwt
    ) throws Exception {
        Seller seller = sellerService.getSellerProfile(jwt);
        long unreadCount = complianceSellerNoteService.countUnread(seller.getId());
        return ResponseEntity.ok(Map.of("unreadCount", unreadCount));
    }

    @GetMapping("/acknowledged-count")
    public ResponseEntity<Map<String, Object>> getAcknowledgedCount(
            @RequestHeader(value = "Authorization", required = false) String jwt
    ) throws Exception {
        Seller seller = sellerService.getSellerProfile(jwt);
        long acknowledgedCount = complianceSellerNoteService.countAcknowledged(seller.getId());
        return ResponseEntity.ok(Map.of("acknowledgedCount", acknowledgedCount));
    }

    private ComplianceSellerNoteSellerResponse toResponse(
            ComplianceSellerNote note,
            boolean read,
            boolean acknowledged
    ) {
        Map<String, Object> impactSummary = complianceSellerNoteService.buildNoteImpactSummary(note.getId());
        ComplianceSellerNoteSellerResponse response = new ComplianceSellerNoteSellerResponse();
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
        response.setRead(read);
        response.setAcknowledged(acknowledged);
        response.setAcknowledgedAt(null);
        response.setImpactedProductCount(asLong(impactSummary.get("impactedProductCount")));
        response.setAttachments(buildSellerAttachmentResponse(note));
        response.setPublishedAt(note.getPublishedAt());
        response.setArchivedAt(note.getArchivedAt());
        response.setCreatedAt(note.getCreatedAt());
        response.setUpdatedAt(note.getUpdatedAt());
        return response;
    }

    private List<Map<String, Object>> buildSellerAttachmentResponse(ComplianceSellerNote note) {
        return complianceSellerNoteService.readAttachments(note).stream()
                .map(raw -> {
                    Map<String, Object> payload = new LinkedHashMap<>();
                    payload.put("id", raw.get("id"));
                    payload.put("name", raw.get("name"));
                    payload.put("uploadedAt", raw.get("uploadedAt"));
                    payload.put(
                            "downloadUrl",
                            String.format(
                                    "/api/seller/compliance/notes/%d/attachments/%s/download",
                                    note.getId(),
                                    raw.get("id")
                            )
                    );
                    return payload;
                })
                .toList();
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
}
