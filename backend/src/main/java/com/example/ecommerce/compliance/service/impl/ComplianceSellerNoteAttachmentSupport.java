package com.example.ecommerce.compliance.service.impl;

import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

final class ComplianceSellerNoteAttachmentSupport {

    private static final int DEFAULT_MAX_ATTACHMENT_COUNT = 10;
    private static final int DEFAULT_MAX_ATTACHMENT_URL_LENGTH = 2048;
    private static final TypeReference<List<Map<String, Object>>> ATTACHMENT_TYPE = new TypeReference<>() {
    };

    private ComplianceSellerNoteAttachmentSupport() {
    }

    static List<Map<String, Object>> readAttachments(
            String attachmentsJson,
            ObjectMapper objectMapper,
            String allowedAttachmentHosts,
            int maxAttachmentCount,
            int maxAttachmentUrlLength
    ) {
        if (attachmentsJson == null || attachmentsJson.isBlank()) {
            return List.of();
        }
        try {
            List<Map<String, Object>> parsed = objectMapper.readValue(attachmentsJson, ATTACHMENT_TYPE);
            if (parsed == null) {
                return List.of();
            }
            return sanitizeAttachments(parsed, false, allowedAttachmentHosts, maxAttachmentCount, maxAttachmentUrlLength);
        } catch (Exception ex) {
            return List.of();
        }
    }

    static String writeAttachments(
            List<Map<String, Object>> attachments,
            ObjectMapper objectMapper,
            String allowedAttachmentHosts,
            int maxAttachmentCount,
            int maxAttachmentUrlLength
    ) {
        List<Map<String, Object>> safeAttachments = sanitizeAttachments(
                attachments == null ? List.of() : new ArrayList<>(attachments),
                true,
                allowedAttachmentHosts,
                maxAttachmentCount,
                maxAttachmentUrlLength
        );
        try {
            return objectMapper.writeValueAsString(safeAttachments);
        } catch (Exception ex) {
            throw new IllegalArgumentException("Invalid attachments payload");
        }
    }

    static List<Map<String, Object>> resolveUpdatedAttachments(
            List<Map<String, Object>> existingAttachments,
            List<Map<String, Object>> incomingAttachments
    ) {
        if (incomingAttachments == null) {
            return List.of();
        }
        Map<String, String> existingUrlsById = existingAttachments.stream()
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
            String normalizedUrl = ComplianceSellerNoteValueSupport.trimToNull(rawUrl);
            if (normalizedUrl == null || normalizedUrl.startsWith("/api/")) {
                if (id != null && existingUrlsById.containsKey(id)) {
                    candidate.put("url", existingUrlsById.get(id));
                }
            }
            resolved.add(candidate);
        }
        return resolved;
    }

    static String sanitizeAttachmentId(String value) {
        String raw = ComplianceSellerNoteValueSupport.trimToNull(value);
        if (raw == null) {
            return null;
        }
        if (!raw.matches("^[A-Za-z0-9_-]{1,64}$")) {
            return null;
        }
        return raw;
    }

    static String normalizeAndValidateAttachmentUrl(
            String rawUrl,
            String allowedAttachmentHosts,
            int maxAttachmentUrlLength
    ) {
        String candidate = ComplianceSellerNoteValueSupport.trimToNull(rawUrl);
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
        if (!isAttachmentHostAllowed(host, allowedAttachmentHosts)) {
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

    private static List<Map<String, Object>> sanitizeAttachments(
            Collection<Map<String, Object>> attachments,
            boolean strict,
            String allowedAttachmentHosts,
            int maxAttachmentCount,
            int maxAttachmentUrlLength
    ) {
        List<Map<String, Object>> rawItems = attachments == null ? List.of() : new ArrayList<>(attachments);
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
                Map<String, Object> item = sanitizeSingleAttachment(
                        rawAttachment,
                        strict,
                        allowedAttachmentHosts,
                        maxAttachmentUrlLength
                );
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

    private static Map<String, Object> sanitizeSingleAttachment(
            Map<String, Object> rawAttachment,
            boolean strict,
            String allowedAttachmentHosts,
            int maxAttachmentUrlLength
    ) {
        if (rawAttachment == null) {
            if (strict) {
                throw new IllegalArgumentException("Attachment entry is required");
            }
            return null;
        }

        String name = sanitizeAttachmentName(rawAttachment.get("name"));
        String uploadedAt = ComplianceSellerNoteValueSupport.trimToNull(rawAttachment.get("uploadedAt") == null
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

        String safeUrl = normalizeAndValidateAttachmentUrl(urlRaw, allowedAttachmentHosts, maxAttachmentUrlLength);
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

    private static String sanitizeAttachmentName(Object value) {
        String raw = value == null ? null : ComplianceSellerNoteValueSupport.trimToNull(String.valueOf(value));
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

    private static boolean isAttachmentHostAllowed(String host, String allowedAttachmentHosts) {
        Set<String> allowList = parseAllowedHosts(allowedAttachmentHosts);
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

    private static Set<String> parseAllowedHosts(String allowedAttachmentHosts) {
        String raw = ComplianceSellerNoteValueSupport.trimToNull(allowedAttachmentHosts);
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
