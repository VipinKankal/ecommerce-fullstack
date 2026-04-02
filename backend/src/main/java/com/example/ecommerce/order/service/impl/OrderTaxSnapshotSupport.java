package com.example.ecommerce.order.service.impl;

import com.example.ecommerce.modal.Order;
import com.example.ecommerce.modal.OrderItem;
import com.example.ecommerce.modal.Product;
import com.example.ecommerce.modal.Seller;
import com.example.ecommerce.tax.service.TaxComputationSupport;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

final class OrderTaxSnapshotSupport {
    static final String ORDER_TYPE_MARKETPLACE = "MARKETPLACE";
    static final String ORDER_TYPE_OWN_BRAND = "OWN_BRAND";
    static final String SNAPSHOT_SOURCE = "ORDER_CREATE_FREEZE_V1";
    static final String DEFAULT_PRICING_MODE = "INCLUSIVE";
    static final String DEFAULT_TAX_CLASS = "APPAREL_STANDARD";
    static final String OWNER_SELLER = "SELLER";
    static final String OWNER_ADMIN = "ADMIN";

    private OrderTaxSnapshotSupport() {
    }

    static List<OrderItem> normalizeItems(List<OrderItem> orderItems) {
        return orderItems == null ? List.of() : orderItems.stream()
                .filter(Objects::nonNull)
                .toList();
    }

    static LocalDate resolveEffectiveDate(Order order) {
        LocalDate resolvedDate = order.getOrderDate() == null ? LocalDate.now() : order.getOrderDate().toLocalDate();
        if (resolvedDate.isAfter(LocalDate.now())) {
            throw new IllegalArgumentException("Order date cannot be in the future for tax snapshot freeze");
        }
        return resolvedDate;
    }

    static List<Double> allocateDiscounts(List<OrderItem> items, double orderLevelDiscount, TaxComputationSupport taxComputationSupport) {
        List<Double> discounts = new ArrayList<>();
        if (items.isEmpty()) {
            return discounts;
        }

        double normalizedDiscount = Math.max(orderLevelDiscount, 0.0);
        double totalLineAmount = items.stream()
                .map(OrderItem::getSellingPrice)
                .filter(Objects::nonNull)
                .mapToDouble(Integer::doubleValue)
                .sum();

        double remainingDiscount = normalizedDiscount;
        for (int index = 0; index < items.size(); index++) {
            OrderItem item = items.get(index);
            double lineAmount = item.getSellingPrice() == null ? 0.0 : item.getSellingPrice();
            double allocatedDiscount;
            if (index == items.size() - 1) {
                allocatedDiscount = remainingDiscount;
            } else if (normalizedDiscount <= 0 || totalLineAmount <= 0 || lineAmount <= 0) {
                allocatedDiscount = 0.0;
            } else {
                allocatedDiscount = taxComputationSupport.roundCurrency((lineAmount / totalLineAmount) * normalizedDiscount);
            }
            allocatedDiscount = Math.min(allocatedDiscount, Math.max(lineAmount, 0.0));
            remainingDiscount = taxComputationSupport.roundCurrency(Math.max(remainingDiscount - allocatedDiscount, 0.0));
            discounts.add(taxComputationSupport.roundCurrency(allocatedDiscount));
        }
        return discounts;
    }

    static String resolveSupplierGstin(List<OrderItem> items) {
        return items.stream()
                .map(OrderItem::getProduct)
                .filter(Objects::nonNull)
                .map(Product::getSeller)
                .filter(Objects::nonNull)
                .map(Seller::getGSTIN)
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .findFirst()
                .orElse(null);
    }

    static String resolveAggregateRuleVersion(List<String> ruleVersions) {
        List<String> normalized = ruleVersions.stream()
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .distinct()
                .toList();
        if (normalized.isEmpty()) {
            return null;
        }
        return normalized.size() == 1 ? normalized.get(0) : "MIXED";
    }

    static Map<String, Object> toLineItemPayload(OrderTaxSnapshotServiceImpl.LineSnapshot lineSnapshot) {
        LinkedHashMap<String, Object> payload = new LinkedHashMap<>();
        payload.put("orderItemId", lineSnapshot.orderItemId());
        payload.put("productId", lineSnapshot.productId());
        payload.put("productTitle", lineSnapshot.productTitle());
        payload.put("quantity", lineSnapshot.quantity());
        payload.put("hsnCode", lineSnapshot.hsnCode());
        payload.put("taxClass", lineSnapshot.taxClass());
        payload.put("pricingMode", lineSnapshot.pricingMode());
        payload.put("declaredTaxPercentage", lineSnapshot.declaredTaxPercentage());
        payload.put("originalLineAmount", lineSnapshot.originalLineAmount());
        payload.put("allocatedDiscount", lineSnapshot.allocatedDiscount());
        payload.put("chargedAmount", lineSnapshot.chargedAmount());
        payload.put("taxableValue", lineSnapshot.taxableValue());
        payload.put("appliedGstRatePercentage", lineSnapshot.appliedGstRatePercentage());
        payload.put("gstAmount", lineSnapshot.gstAmount());
        payload.put("amountWithTax", lineSnapshot.amountWithTax());
        payload.put("commissionAmount", lineSnapshot.commissionAmount());
        payload.put("commissionGstAmount", lineSnapshot.commissionGstAmount());
        payload.put("gstRuleVersion", lineSnapshot.gstRuleVersion());
        return payload;
    }

    static String writePayload(Map<String, Object> payload, ObjectMapper objectMapper) {
        try {
            return objectMapper.writeValueAsString(payload);
        } catch (JacksonException exception) {
            throw new IllegalStateException("Unable to serialize order tax snapshot payload");
        }
    }

    static String normalizePricingMode(String pricingMode) {
        if (pricingMode == null || pricingMode.isBlank()) {
            return DEFAULT_PRICING_MODE;
        }
        String normalized = pricingMode.trim().toUpperCase();
        return "EXCLUSIVE".equals(normalized) ? "EXCLUSIVE" : DEFAULT_PRICING_MODE;
    }

    static String normalizeTaxClass(String taxClass) {
        if (taxClass == null || taxClass.isBlank()) {
            return DEFAULT_TAX_CLASS;
        }
        return taxClass.trim().toUpperCase();
    }

    static String normalizeNullable(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isBlank() ? null : trimmed.toUpperCase();
    }

    static String resolveInvoiceOwner(String orderType) {
        if (ORDER_TYPE_OWN_BRAND.equalsIgnoreCase(orderType)) {
            return OWNER_ADMIN;
        }
        return OWNER_SELLER;
    }

    static String resolveLiabilityOwner(String orderType) {
        if (ORDER_TYPE_OWN_BRAND.equalsIgnoreCase(orderType)) {
            return OWNER_ADMIN;
        }
        return OWNER_SELLER;
    }
}
