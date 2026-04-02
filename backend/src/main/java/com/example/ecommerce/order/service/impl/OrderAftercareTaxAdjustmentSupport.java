package com.example.ecommerce.order.service.impl;

import com.example.ecommerce.modal.Order;
import com.example.ecommerce.modal.OrderItem;
import com.example.ecommerce.modal.OrderReturnExchangeRequest;
import com.example.ecommerce.modal.OrderTaxSnapshot;
import com.example.ecommerce.modal.Product;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

final class OrderAftercareTaxAdjustmentSupport {
    static final String DEFAULT_CURRENCY = "INR";

    private OrderAftercareTaxAdjustmentSupport() {
    }

    static Map<String, Object> findSnapshotLinePayload(OrderTaxSnapshot snapshot, Long orderItemId, ObjectMapper objectMapper) {
        if (snapshot == null || snapshot.getSnapshotPayload() == null || snapshot.getSnapshotPayload().isBlank()) {
            return Map.of();
        }

        try {
            Map<String, Object> payload = objectMapper.readValue(
                    snapshot.getSnapshotPayload(),
                    new TypeReference<LinkedHashMap<String, Object>>() {
                    }
            );
            Object rawLineItems = payload.get("lineItems");
            if (!(rawLineItems instanceof List<?> lineItems)) {
                return Map.of();
            }
            for (Object lineItem : lineItems) {
                if (!(lineItem instanceof Map<?, ?> rawMap)) {
                    continue;
                }
                Long candidateOrderItemId = toLong(rawMap.get("orderItemId"));
                if (orderItemId != null && orderItemId.equals(candidateOrderItemId)) {
                    LinkedHashMap<String, Object> normalized = new LinkedHashMap<>();
                    rawMap.forEach((key, value) -> normalized.put(String.valueOf(key), value));
                    return normalized;
                }
            }
        } catch (Exception ignored) {
            return Map.of();
        }

        return Map.of();
    }

    static String resolveCurrencyCode(Order order, Long orderItemId) {
        if (order == null || order.getOrderItems() == null) {
            return DEFAULT_CURRENCY;
        }
        for (OrderItem item : order.getOrderItems()) {
            if (item == null || item.getId() == null || !item.getId().equals(orderItemId)) {
                continue;
            }
            Product product = item.getProduct();
            if (product != null && product.getCurrencyCode() != null && !product.getCurrencyCode().isBlank()) {
                return product.getCurrencyCode().trim().toUpperCase(Locale.ROOT);
            }
        }
        return DEFAULT_CURRENCY;
    }

    static Map<String, Object> negateAmounts(String label, Map<String, Object> source) {
        return buildAmountMap(
                label,
                -toDouble(source.get("grossAmount")),
                -toDouble(source.get("taxableAmount")),
                -toDouble(source.get("gstAmount")),
                -toDouble(source.get("commissionAmount")),
                -toDouble(source.get("commissionGstAmount")),
                -toDouble(source.get("tcsAmount")),
                -toDouble(source.get("sellerPayableAmount")),
                -toDouble(source.get("sellerGstLiabilityAmount")),
                -toDouble(source.get("adminRevenueAmount")),
                -toDouble(source.get("adminGstLiabilityAmount")),
                String.valueOf(source.get("currencyCode")),
                toDouble(source.get("taxRatePercentage")),
                toDouble(source.get("tcsRatePercentage"))
        );
    }

    static Map<String, Object> sumAmounts(String label, Map<String, Object> first, Map<String, Object> second) {
        return buildAmountMap(
                label,
                toDouble(first.get("grossAmount")) + toDouble(second.get("grossAmount")),
                toDouble(first.get("taxableAmount")) + toDouble(second.get("taxableAmount")),
                toDouble(first.get("gstAmount")) + toDouble(second.get("gstAmount")),
                toDouble(first.get("commissionAmount")) + toDouble(second.get("commissionAmount")),
                toDouble(first.get("commissionGstAmount")) + toDouble(second.get("commissionGstAmount")),
                toDouble(first.get("tcsAmount")) + toDouble(second.get("tcsAmount")),
                toDouble(first.get("sellerPayableAmount")) + toDouble(second.get("sellerPayableAmount")),
                toDouble(first.get("sellerGstLiabilityAmount")) + toDouble(second.get("sellerGstLiabilityAmount")),
                toDouble(first.get("adminRevenueAmount")) + toDouble(second.get("adminRevenueAmount")),
                toDouble(first.get("adminGstLiabilityAmount")) + toDouble(second.get("adminGstLiabilityAmount")),
                String.valueOf(first.get("currencyCode")),
                toDouble(second.get("taxRatePercentage")) > 0 ? toDouble(second.get("taxRatePercentage")) : toDouble(first.get("taxRatePercentage")),
                toDouble(first.get("tcsRatePercentage"))
        );
    }

    static Map<String, Object> buildAmountMap(
            String label,
            double grossAmount,
            double taxableAmount,
            double gstAmount,
            double commissionAmount,
            double commissionGstAmount,
            double tcsAmount,
            double sellerPayableAmount,
            double sellerGstLiabilityAmount,
            double adminRevenueAmount,
            double adminGstLiabilityAmount,
            String currencyCode,
            double taxRatePercentage,
            double tcsRatePercentage
    ) {
        LinkedHashMap<String, Object> amounts = new LinkedHashMap<>();
        amounts.put("label", label);
        amounts.put("currencyCode", normalizeCurrency(currencyCode));
        amounts.put("grossAmount", roundCurrency(grossAmount));
        amounts.put("taxableAmount", roundCurrency(taxableAmount));
        amounts.put("gstAmount", roundCurrency(gstAmount));
        amounts.put("commissionAmount", roundCurrency(commissionAmount));
        amounts.put("commissionGstAmount", roundCurrency(commissionGstAmount));
        amounts.put("tcsAmount", roundCurrency(tcsAmount));
        amounts.put("sellerPayableAmount", roundCurrency(sellerPayableAmount));
        amounts.put("sellerGstLiabilityAmount", roundCurrency(sellerGstLiabilityAmount));
        amounts.put("adminRevenueAmount", roundCurrency(adminRevenueAmount));
        amounts.put("adminGstLiabilityAmount", roundCurrency(adminGstLiabilityAmount));
        amounts.put("taxRatePercentage", roundPercentage(taxRatePercentage));
        amounts.put("tcsRatePercentage", roundPercentage(tcsRatePercentage));
        return amounts;
    }

    static String determineNoteType(Map<String, Object> netDelta) {
        double grossAmount = toDouble(netDelta.get("grossAmount"));
        if (grossAmount > 0.009) {
            return "DEBIT_NOTE";
        }
        if (grossAmount < -0.009) {
            return "CREDIT_NOTE";
        }
        return "ADJUSTMENT_MEMO";
    }

    static String buildExchangeSummary(String noteType, boolean posted, double customerBalanceDelta) {
        String prefix = posted ? "Exchange adjustment posted." : "Exchange adjustment preview ready.";
        if ("DEBIT_NOTE".equals(noteType)) {
            return prefix + " Replacement value is higher; debit-note style delta applies. Customer balance delta: " + roundCurrency(customerBalanceDelta) + ".";
        }
        if ("CREDIT_NOTE".equals(noteType)) {
            return prefix + " Replacement value is lower; credit-note style delta applies. Customer balance delta: " + roundCurrency(customerBalanceDelta) + ".";
        }
        return prefix + " Replacement value matches the original line, so only neutral adjustment tracking is required.";
    }

    static String normalizePricingMode(String pricingMode) {
        if (pricingMode == null || pricingMode.isBlank()) {
            return "INCLUSIVE";
        }
        return "EXCLUSIVE".equalsIgnoreCase(pricingMode.trim()) ? "EXCLUSIVE" : "INCLUSIVE";
    }

    static String normalizeCurrency(String currencyCode) {
        if (currencyCode == null || currencyCode.isBlank() || "null".equalsIgnoreCase(currencyCode.trim())) {
            return DEFAULT_CURRENCY;
        }
        return currencyCode.trim().toUpperCase(Locale.ROOT);
    }

    static String normalizeNullable(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim().toUpperCase(Locale.ROOT);
    }

    static String normalize(String value) {
        return value == null ? "" : value.trim().toUpperCase(Locale.ROOT);
    }

    static double safe(Number value) {
        return value == null ? 0.0 : value.doubleValue();
    }

    static double toDouble(Object value) {
        if (value instanceof Number number) {
            return number.doubleValue();
        }
        if (value == null) {
            return 0.0;
        }
        try {
            return Double.parseDouble(String.valueOf(value));
        } catch (NumberFormatException ex) {
            return 0.0;
        }
    }

    static Long toLong(Object value) {
        if (value instanceof Number number) {
            return number.longValue();
        }
        if (value == null) {
            return null;
        }
        try {
            return Long.parseLong(String.valueOf(value));
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    static double roundCurrency(double value) {
        return BigDecimal.valueOf(value).setScale(2, RoundingMode.HALF_UP).doubleValue();
    }

    static double roundPercentage(double value) {
        return BigDecimal.valueOf(value).setScale(3, RoundingMode.HALF_UP).doubleValue();
    }
}
