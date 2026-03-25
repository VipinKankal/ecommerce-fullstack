package com.example.ecommerce.order.service.impl;

import com.example.ecommerce.modal.Order;
import com.example.ecommerce.modal.OrderItem;
import com.example.ecommerce.modal.OrderReturnExchangeRequest;
import com.example.ecommerce.modal.OrderTaxSnapshot;
import com.example.ecommerce.modal.Product;
import com.example.ecommerce.repository.OrderRepository;
import com.example.ecommerce.repository.ProductRepository;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class OrderAftercareTaxAdjustmentService {

    private static final String DEFAULT_CURRENCY = "INR";
    private static final Set<String> RETURN_ADJUSTMENT_STATUSES = Set.of(
            "REFUND_PENDING",
            "REFUND_INITIATED",
            "RETURNED"
    );
    private static final Set<String> EXCHANGE_ADJUSTMENT_STATUSES = Set.of(
            "EXCHANGE_RECEIVED",
            "EXCHANGE_SHIPPED",
            "EXCHANGE_COMPLETED"
    );

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final ObjectMapper objectMapper;

    public Map<String, Object> buildReturnTaxAdjustment(OrderReturnExchangeRequest request) {
        if (request == null || !RETURN_ADJUSTMENT_STATUSES.contains(normalize(request.getStatus()))) {
            return null;
        }

        Map<String, Object> original = resolveOriginalLineAmounts(request);
        if (original == null || original.isEmpty()) {
            return null;
        }

        Map<String, Object> delta = negateAmounts("RETURN_REVERSAL", original);
        boolean posted = "RETURNED".equals(normalize(request.getStatus()));

        LinkedHashMap<String, Object> response = new LinkedHashMap<>();
        response.put("postingStatus", posted ? "POSTED" : "PREVIEW");
        response.put("noteType", "CREDIT_NOTE");
        response.put(
                "summary",
                posted
                        ? "Refund completed. Credit-note style GST, commission, and TCS reversal posted."
                        : "Refund flow is active. Credit-note style GST, commission, and TCS reversal preview ready."
        );
        response.put("currencyCode", original.get("currencyCode"));
        response.put("original", original);
        response.put("delta", delta);
        return response;
    }

    public Map<String, Object> buildExchangeTaxAdjustment(OrderReturnExchangeRequest request) {
        if (request == null || !EXCHANGE_ADJUSTMENT_STATUSES.contains(normalize(request.getStatus()))) {
            return null;
        }

        Map<String, Object> original = resolveOriginalLineAmounts(request);
        Map<String, Object> replacement = buildReplacementLineAmounts(request, original);
        if (original == null || original.isEmpty() || replacement == null || replacement.isEmpty()) {
            return null;
        }

        Map<String, Object> oldItemReversal = negateAmounts("OLD_ITEM_REVERSAL", original);
        Map<String, Object> netDelta = sumAmounts("NET_DELTA", oldItemReversal, replacement);
        boolean posted = Set.of("EXCHANGE_SHIPPED", "EXCHANGE_COMPLETED").contains(normalize(request.getStatus()));
        String noteType = determineNoteType(netDelta);

        LinkedHashMap<String, Object> response = new LinkedHashMap<>();
        response.put("postingStatus", posted ? "POSTED" : "PREVIEW");
        response.put("noteType", noteType);
        response.put(
                "summary",
                buildExchangeSummary(noteType, posted, safe(request.getPriceDifference()))
        );
        response.put("currencyCode", original.get("currencyCode"));
        response.put("customerBalanceDelta", roundCurrency(safe(request.getPriceDifference())));
        response.put("balanceMode", normalizeNullable(request.getBalanceMode()));
        response.put("oldItemReversal", oldItemReversal);
        response.put("replacementCharge", replacement);
        response.put("netDelta", netDelta);
        return response;
    }

    private Map<String, Object> resolveOriginalLineAmounts(OrderReturnExchangeRequest request) {
        Order order = request.getOrderId() == null
                ? null
                : orderRepository.findDetailedById(request.getOrderId()).orElse(null);
        if (order == null || order.getOrderTaxSnapshot() == null) {
            return null;
        }

        OrderTaxSnapshot snapshot = order.getOrderTaxSnapshot();
        Map<String, Object> linePayload = findSnapshotLinePayload(snapshot, request.getOrderItemId());
        if (linePayload.isEmpty()) {
            return null;
        }

        double taxableAmount = toDouble(linePayload.get("taxableValue"));
        double gstAmount = toDouble(linePayload.get("gstAmount"));
        double grossAmount = toDouble(linePayload.get("amountWithTax"));
        if (grossAmount <= 0) {
            grossAmount = toDouble(linePayload.get("chargedAmount"));
        }
        if (grossAmount <= 0) {
            grossAmount = taxableAmount + gstAmount;
        }
        double commissionAmount = toDouble(linePayload.get("commissionAmount"));
        double commissionGstAmount = toDouble(linePayload.get("commissionGstAmount"));
        double snapshotTaxableTotal = safe(snapshot.getTotalTaxableValue());
        double snapshotTcsAmount = safe(snapshot.getTcsAmount());
        double tcsRatePercentage = safe(snapshot.getTcsRatePercentage());
        if (tcsRatePercentage <= 0 && snapshotTaxableTotal > 0) {
            tcsRatePercentage = roundPercentage((snapshotTcsAmount / snapshotTaxableTotal) * 100.0);
        }
        double tcsAmount = snapshotTaxableTotal > 0
                ? roundCurrency(snapshotTcsAmount * (taxableAmount / snapshotTaxableTotal))
                : 0.0;
        double sellerPayableAmount = roundCurrency(grossAmount - commissionAmount - commissionGstAmount - tcsAmount);
        double taxRatePercentage = taxableAmount > 0
                ? roundPercentage((gstAmount / taxableAmount) * 100.0)
                : 0.0;

        return buildAmountMap(
                "ORIGINAL_LINE",
                grossAmount,
                taxableAmount,
                gstAmount,
                commissionAmount,
                commissionGstAmount,
                tcsAmount,
                sellerPayableAmount,
                gstAmount,
                commissionAmount,
                commissionGstAmount + tcsAmount,
                resolveCurrencyCode(order, request.getOrderItemId()),
                taxRatePercentage,
                tcsRatePercentage
        );
    }

    private Map<String, Object> buildReplacementLineAmounts(
            OrderReturnExchangeRequest request,
            Map<String, Object> original
    ) {
        if (original == null || original.isEmpty()) {
            return null;
        }

        Long requestedProductId = request.getRequestedNewProductId() != null
                ? request.getRequestedNewProductId()
                : request.getProductId();
        Product product = requestedProductId == null
                ? null
                : productRepository.findById(requestedProductId).orElse(null);

        int quantity = Math.max(request.getQuantityRequested() == null ? 1 : request.getQuantityRequested(), 1);
        double unitPrice = request.getNewPrice() == null
                ? (product == null ? 0.0 : product.getSellingPrice())
                : request.getNewPrice();
        double pricingInput = Math.max(unitPrice, 0.0) * quantity;
        double taxRatePercentage = safe(product == null ? null : product.getTaxPercentage());
        if (taxRatePercentage <= 0) {
            taxRatePercentage = toDouble(original.get("taxRatePercentage"));
        }

        String pricingMode = normalizePricingMode(product == null ? null : product.getPricingMode());
        double taxableAmount;
        double gstAmount;
        double grossAmount;
        if ("EXCLUSIVE".equals(pricingMode)) {
            taxableAmount = pricingInput;
            gstAmount = taxableAmount * (taxRatePercentage / 100.0);
            grossAmount = taxableAmount + gstAmount;
        } else {
            grossAmount = pricingInput;
            taxableAmount = taxRatePercentage > 0
                    ? grossAmount / (1 + (taxRatePercentage / 100.0))
                    : grossAmount;
            gstAmount = grossAmount - taxableAmount;
        }

        double fallbackCommissionAmount = quantity > 0
                ? toDouble(original.get("commissionAmount")) / quantity
                : 0.0;
        double commissionPerUnit = product != null && product.getPlatformCommission() != null
                ? Math.max(product.getPlatformCommission(), 0.0)
                : Math.max(fallbackCommissionAmount, 0.0);
        double commissionAmount = commissionPerUnit * quantity;
        double commissionGstAmount = commissionAmount * 0.18;
        double tcsRatePercentage = toDouble(original.get("tcsRatePercentage"));
        double tcsAmount = taxableAmount * (tcsRatePercentage / 100.0);
        double sellerPayableAmount = grossAmount - commissionAmount - commissionGstAmount - tcsAmount;
        String currencyCode = product != null && product.getCurrencyCode() != null && !product.getCurrencyCode().isBlank()
                ? product.getCurrencyCode().trim().toUpperCase(Locale.ROOT)
                : String.valueOf(original.get("currencyCode"));

        return buildAmountMap(
                "REPLACEMENT_LINE",
                grossAmount,
                taxableAmount,
                gstAmount,
                commissionAmount,
                commissionGstAmount,
                tcsAmount,
                sellerPayableAmount,
                gstAmount,
                commissionAmount,
                commissionGstAmount + tcsAmount,
                currencyCode,
                taxRatePercentage,
                tcsRatePercentage
        );
    }

    private Map<String, Object> findSnapshotLinePayload(OrderTaxSnapshot snapshot, Long orderItemId) {
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

    private String resolveCurrencyCode(Order order, Long orderItemId) {
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

    private Map<String, Object> negateAmounts(String label, Map<String, Object> source) {
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

    private Map<String, Object> sumAmounts(String label, Map<String, Object> first, Map<String, Object> second) {
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
                toDouble(second.get("taxRatePercentage")) > 0
                        ? toDouble(second.get("taxRatePercentage"))
                        : toDouble(first.get("taxRatePercentage")),
                toDouble(first.get("tcsRatePercentage"))
        );
    }

    private Map<String, Object> buildAmountMap(
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

    private String determineNoteType(Map<String, Object> netDelta) {
        double grossAmount = toDouble(netDelta.get("grossAmount"));
        if (grossAmount > 0.009) {
            return "DEBIT_NOTE";
        }
        if (grossAmount < -0.009) {
            return "CREDIT_NOTE";
        }
        return "ADJUSTMENT_MEMO";
    }

    private String buildExchangeSummary(String noteType, boolean posted, double customerBalanceDelta) {
        String prefix = posted
                ? "Exchange adjustment posted."
                : "Exchange adjustment preview ready.";
        if ("DEBIT_NOTE".equals(noteType)) {
            return prefix + " Replacement value is higher; debit-note style delta applies. Customer balance delta: "
                    + roundCurrency(customerBalanceDelta) + ".";
        }
        if ("CREDIT_NOTE".equals(noteType)) {
            return prefix + " Replacement value is lower; credit-note style delta applies. Customer balance delta: "
                    + roundCurrency(customerBalanceDelta) + ".";
        }
        return prefix + " Replacement value matches the original line, so only neutral adjustment tracking is required.";
    }

    private String normalizePricingMode(String pricingMode) {
        if (pricingMode == null || pricingMode.isBlank()) {
            return "INCLUSIVE";
        }
        return "EXCLUSIVE".equalsIgnoreCase(pricingMode.trim()) ? "EXCLUSIVE" : "INCLUSIVE";
    }

    private String normalizeCurrency(String currencyCode) {
        if (currencyCode == null || currencyCode.isBlank() || "null".equalsIgnoreCase(currencyCode.trim())) {
            return DEFAULT_CURRENCY;
        }
        return currencyCode.trim().toUpperCase(Locale.ROOT);
    }

    private String normalizeNullable(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim().toUpperCase(Locale.ROOT);
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toUpperCase(Locale.ROOT);
    }

    private double safe(Number value) {
        return value == null ? 0.0 : value.doubleValue();
    }

    private double toDouble(Object value) {
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

    private Long toLong(Object value) {
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

    private double roundCurrency(double value) {
        return BigDecimal.valueOf(value).setScale(2, RoundingMode.HALF_UP).doubleValue();
    }

    private double roundPercentage(double value) {
        return BigDecimal.valueOf(value).setScale(3, RoundingMode.HALF_UP).doubleValue();
    }
}

