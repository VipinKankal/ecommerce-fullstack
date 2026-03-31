package com.example.ecommerce.compliance.service.impl;

import com.example.ecommerce.modal.ComplianceSellerNote;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

final class ComplianceSellerNoteValueSupport {

    private ComplianceSellerNoteValueSupport() {
    }

    static String normalizeTab(String tab) {
        String normalized = normalizeNullable(tab);
        if (normalized == null) {
            return "LATEST";
        }
        if (!Set.of("LATEST", "UNREAD", "ARCHIVED").contains(normalized)) {
            throw new IllegalArgumentException("Unsupported notes tab");
        }
        return normalized;
    }

    static String normalizeQuery(String query) {
        if (query == null) {
            return null;
        }
        String trimmed = query.trim().toLowerCase(Locale.ROOT);
        return trimmed.isBlank() ? null : trimmed;
    }

    static String normalizeRequired(String value, Set<String> allowed, String errorMessage) {
        String normalized = normalizeNullable(value);
        if (normalized == null) {
            throw new IllegalArgumentException(errorMessage);
        }
        assertAllowed(normalized, allowed, errorMessage);
        return normalized;
    }

    static String normalizeWithFallback(String value, String fallback, Set<String> allowed, String errorMessage) {
        String normalized = normalizeNullable(value);
        String resolved = normalized == null ? normalizeNullable(fallback) : normalized;
        if (resolved == null) {
            throw new IllegalArgumentException(errorMessage);
        }
        assertAllowed(resolved, allowed, errorMessage);
        return resolved;
    }

    static void assertAllowed(String value, Set<String> allowed, String errorMessage) {
        if (!allowed.contains(value)) {
            throw new IllegalArgumentException(errorMessage);
        }
    }

    static String trimRequired(String value, String errorMessage) {
        String trimmed = trimToNull(value);
        if (trimmed == null) {
            throw new IllegalArgumentException(errorMessage);
        }
        return trimmed;
    }

    static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isBlank() ? null : trimmed;
    }

    static String normalizeNullable(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isBlank() ? null : trimmed.toUpperCase(Locale.ROOT);
    }

    static String lower(String value) {
        return value == null ? "" : value.toLowerCase(Locale.ROOT);
    }

    static String normalizeCategoryKey(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim().toLowerCase(Locale.ROOT);
        return trimmed.isBlank() ? null : trimmed;
    }

    static String firstNonBlank(String first, String second) {
        String one = trimToNull(first);
        if (one != null) {
            return one;
        }
        return trimToNull(second);
    }

    static String valueAsString(Map<String, Object> payload, String key) {
        if (payload == null || key == null) {
            return null;
        }
        Object value = payload.get(key);
        return value == null ? null : String.valueOf(value);
    }

    static LocalDate valueAsLocalDate(Object value) {
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

    static double roundPercentage(double value) {
        return Math.round(value * 1000.0) / 1000.0;
    }

    static boolean containsQuery(ComplianceSellerNote note, String normalizedQuery) {
        if (normalizedQuery == null) {
            return true;
        }
        return lower(note.getTitle()).contains(normalizedQuery)
                || lower(note.getShortSummary()).contains(normalizedQuery)
                || lower(note.getFullNote()).contains(normalizedQuery);
    }

    static boolean isWithinAnalyticsPeriod(
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

    static Comparator<ComplianceSellerNote> noteComparator() {
        return Comparator
                .comparing(ComplianceSellerNote::isPinned).reversed()
                .thenComparing(ComplianceSellerNoteValueSupport::resolveSortDate, Comparator.nullsLast(Comparator.reverseOrder()));
    }

    private static LocalDate resolveAnalyticsAnchorDate(ComplianceSellerNote note) {
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

    private static LocalDateTime resolveSortDate(ComplianceSellerNote note) {
        if (note.getPublishedAt() != null) {
            return note.getPublishedAt();
        }
        if (note.getUpdatedAt() != null) {
            return note.getUpdatedAt();
        }
        return note.getCreatedAt();
    }
}
