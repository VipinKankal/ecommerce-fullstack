package com.example.ecommerce.order.service.impl;

import com.example.ecommerce.modal.OrderReturnExchangeRequest;
import com.example.ecommerce.modal.RequestHistoryEntry;

import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

final class OrderAftercareValueSupport {

    private OrderAftercareValueSupport() {
    }

    static void applyBankDetails(OrderReturnExchangeRequest request, Map<String, Object> payload) {
        if (payload == null || payload.isEmpty()) {
            return;
        }
        request.setBankAccountHolderName(firstNonBlank(valueAsString(payload, "accountHolderName"), request.getBankAccountHolderName()));
        request.setBankAccountNumber(firstNonBlank(valueAsString(payload, "accountNumber"), request.getBankAccountNumber()));
        request.setBankIfscCode(firstNonBlank(valueAsString(payload, "ifscCode"), request.getBankIfscCode()));
        request.setBankName(firstNonBlank(valueAsString(payload, "bankName"), request.getBankName()));
        request.setBankUpiId(firstNonBlank(valueAsString(payload, "upiId"), request.getBankUpiId()));
    }

    static void addHistory(OrderReturnExchangeRequest request, String status, String note, String updatedBy) {
        if (request.getHistory() == null) {
            request.setHistory(new ArrayList<>());
        }
        RequestHistoryEntry entry = new RequestHistoryEntry();
        entry.setStatus(status);
        entry.setNote(note);
        entry.setUpdatedBy(updatedBy);
        entry.setCreatedAt(LocalDateTime.now());
        request.getHistory().add(entry);
    }

    static String nextRequestNumber(String requestType) {
        return "%s-%d".formatted(
                "EXCHANGE".equals(requestType) ? "EXC" : "RET",
                System.currentTimeMillis()
        );
    }

    static String normalizeType(String value) {
        return value == null ? "" : value.trim().toUpperCase(Locale.ROOT);
    }

    static String firstNonBlank(String first, String second) {
        if (first != null && !first.isBlank()) {
            return first.trim();
        }
        if (second != null && !second.isBlank()) {
            return second.trim();
        }
        return null;
    }

    static boolean shouldRestockForQc(String qcResult) {
        return "QC_PASS".equalsIgnoreCase(firstNonBlank(qcResult, ""));
    }

    static String valueAsString(Map<String, Object> payload, String key) {
        if (payload == null) {
            return null;
        }
        Object value = payload.get(key);
        return value == null ? null : String.valueOf(value);
    }

    static Long valueAsLong(Map<String, Object> payload, String key) {
        if (payload == null) {
            return null;
        }
        Object value = payload.get(key);
        if (value == null) {
            return null;
        }
        if (value instanceof Number number) {
            return number.longValue();
        }
        try {
            return Long.parseLong(String.valueOf(value));
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    @SuppressWarnings("unchecked")
    static Map<String, Object> nestedMap(Map<String, Object> payload, String key) {
        if (payload == null) {
            return Map.of();
        }
        Object value = payload.get(key);
        if (value instanceof Map<?, ?> map) {
            return (Map<String, Object>) map;
        }
        return Map.of();
    }

    static LocalDateTime parseDateTime(Object value, LocalDateTime fallback) {
        if (value == null) {
            return fallback;
        }
        try {
            return LocalDateTime.parse(String.valueOf(value).replace("Z", ""));
        } catch (DateTimeParseException ex) {
            return fallback;
        }
    }

    static List<Map<String, Object>> toHistory(OrderReturnExchangeRequest request) {
        if (request.getHistory() == null) {
            return List.of();
        }
        return request.getHistory().stream().map(entry -> {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("status", entry.getStatus());
            item.put("note", entry.getNote());
            item.put("updatedBy", entry.getUpdatedBy());
            item.put("createdAt", entry.getCreatedAt());
            return item;
        }).toList();
    }

    static String maskCustomerName(String value) {
        if (value == null || value.isBlank()) {
            return "Customer";
        }
        String trimmed = value.trim();
        if (trimmed.length() == 1) {
            return trimmed + "***";
        }
        return trimmed.charAt(0) + "***";
    }
}
