package com.example.ecommerce.order.service.impl;

import org.json.JSONArray;
import org.json.JSONObject;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;
import java.util.Locale;

final class PhonePeSupport {

    private PhonePeSupport() {
    }

    static String encodePayload(JSONObject payload) {
        return Base64.getEncoder()
                .encodeToString(payload.toString().getBytes(StandardCharsets.UTF_8));
    }

    static JSONObject parsePhonePeResponse(String body) {
        if (!PaymentGatewaySupport.isMeaningfulSecret(body)) {
            throw new IllegalArgumentException("Empty response received from PhonePe");
        }
        return new JSONObject(body);
    }

    static String resolvePhonePeStatus(JSONObject response) {
        String combined = PaymentGatewaySupport.firstNonBlank(
                extractNestedString(response, "data", "state"),
                extractNestedString(response, "state"),
                extractNestedString(response, "data", "status"),
                extractNestedString(response, "status"),
                extractNestedString(response, "code"),
                extractNestedString(response, "message")
        );

        String normalized = combined == null ? "" : combined.trim().toUpperCase(Locale.ROOT);
        if (normalized.contains("SUCCESS")
                || normalized.contains("COMPLETED")
                || normalized.contains("CAPTURED")
                || normalized.contains("PAYMENT_SUCCESS")) {
            return "SUCCESS";
        }
        if (normalized.contains("FAIL")
                || normalized.contains("DECLINED")
                || normalized.contains("ERROR")
                || normalized.contains("EXPIRED")
                || normalized.contains("CANCELLED")) {
            return "FAILED";
        }
        return "PENDING";
    }

    static String buildMerchantTransactionId(Long paymentOrderId) {
        return "PHONEPE-" + paymentOrderId + "-" + System.currentTimeMillis();
    }

    static String buildPayloadSignature(String encodedRequest, String path, String phonePeSaltKey, String phonePeSaltIndex)
            throws Exception {
        return sha256Hex(encodedRequest + path + phonePeSaltKey) + "###" + phonePeSaltIndex;
    }

    static String buildStatusSignature(String path, String phonePeSaltKey, String phonePeSaltIndex) throws Exception {
        return sha256Hex(path + phonePeSaltKey) + "###" + phonePeSaltIndex;
    }

    private static String sha256Hex(String value) throws Exception {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        byte[] hash = digest.digest(value.getBytes(StandardCharsets.UTF_8));
        StringBuilder builder = new StringBuilder();
        for (byte b : hash) {
            builder.append(String.format("%02x", b));
        }
        return builder.toString();
    }

    private static String extractNestedString(JSONObject root, String... path) {
        Object current = root;
        for (String key : path) {
            if (!(current instanceof JSONObject currentObject) || !currentObject.has(key)) {
                return null;
            }
            current = currentObject.opt(key);
        }
        return extractStringValue(current);
    }

    private static String extractStringValue(Object value) {
        if (value == null || value == JSONObject.NULL) {
            return null;
        }
        if (value instanceof String str) {
            return str;
        }
        if (value instanceof Number || value instanceof Boolean) {
            return String.valueOf(value);
        }
        if (value instanceof JSONObject object) {
            return PaymentGatewaySupport.firstNonBlank(
                    extractNestedString(object, "url"),
                    extractNestedString(object, "redirectUrl"),
                    extractNestedString(object, "merchantTransactionId"),
                    extractNestedString(object, "transactionId"),
                    extractNestedString(object, "status"),
                    extractNestedString(object, "state")
            );
        }
        if (value instanceof JSONArray array) {
            for (int index = 0; index < array.length(); index++) {
                String nested = extractStringValue(array.opt(index));
                if (nested != null) {
                    return nested;
                }
            }
        }
        return null;
    }
}
