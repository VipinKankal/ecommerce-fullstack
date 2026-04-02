package com.example.ecommerce.order.service.impl;

import com.example.ecommerce.modal.Order;
import com.example.ecommerce.modal.OrderItem;
import com.example.ecommerce.modal.OrderReturnExchangeRequest;
import com.example.ecommerce.modal.OrderTaxSnapshot;
import com.example.ecommerce.modal.Product;
import com.example.ecommerce.repository.OrderRepository;
import com.example.ecommerce.repository.ProductRepository;
import tools.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class OrderAftercareTaxAdjustmentService {

    private static final Set<String> RETURN_ADJUSTMENT_STATUSES = Set.of("REFUND_PENDING", "REFUND_INITIATED", "RETURNED");
    private static final Set<String> EXCHANGE_ADJUSTMENT_STATUSES = Set.of("EXCHANGE_RECEIVED", "EXCHANGE_SHIPPED", "EXCHANGE_COMPLETED");

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final ObjectMapper objectMapper;

    public Map<String, Object> buildReturnTaxAdjustment(OrderReturnExchangeRequest request) {
        if (request == null || !RETURN_ADJUSTMENT_STATUSES.contains(OrderAftercareTaxAdjustmentSupport.normalize(request.getStatus()))) {
            return null;
        }

        Map<String, Object> original = resolveOriginalLineAmounts(request);
        if (original == null || original.isEmpty()) {
            return null;
        }

        Map<String, Object> delta = OrderAftercareTaxAdjustmentSupport.negateAmounts("RETURN_REVERSAL", original);
        boolean posted = "RETURNED".equals(OrderAftercareTaxAdjustmentSupport.normalize(request.getStatus()));

        LinkedHashMap<String, Object> response = new LinkedHashMap<>();
        response.put("postingStatus", posted ? "POSTED" : "PREVIEW");
        response.put("noteType", "CREDIT_NOTE");
        response.put("summary", posted
                ? "Refund completed. Credit-note style GST, commission, and TCS reversal posted."
                : "Refund flow is active. Credit-note style GST, commission, and TCS reversal preview ready.");
        response.put("currencyCode", original.get("currencyCode"));
        response.put("original", original);
        response.put("delta", delta);
        return response;
    }

    public Map<String, Object> buildExchangeTaxAdjustment(OrderReturnExchangeRequest request) {
        if (request == null || !EXCHANGE_ADJUSTMENT_STATUSES.contains(OrderAftercareTaxAdjustmentSupport.normalize(request.getStatus()))) {
            return null;
        }

        Map<String, Object> original = resolveOriginalLineAmounts(request);
        Map<String, Object> replacement = buildReplacementLineAmounts(request, original);
        if (original == null || original.isEmpty() || replacement == null || replacement.isEmpty()) {
            return null;
        }

        Map<String, Object> oldItemReversal = OrderAftercareTaxAdjustmentSupport.negateAmounts("OLD_ITEM_REVERSAL", original);
        Map<String, Object> netDelta = OrderAftercareTaxAdjustmentSupport.sumAmounts("NET_DELTA", oldItemReversal, replacement);
        boolean posted = Set.of("EXCHANGE_SHIPPED", "EXCHANGE_COMPLETED").contains(OrderAftercareTaxAdjustmentSupport.normalize(request.getStatus()));
        String noteType = OrderAftercareTaxAdjustmentSupport.determineNoteType(netDelta);

        LinkedHashMap<String, Object> response = new LinkedHashMap<>();
        response.put("postingStatus", posted ? "POSTED" : "PREVIEW");
        response.put("noteType", noteType);
        response.put("summary", OrderAftercareTaxAdjustmentSupport.buildExchangeSummary(noteType, posted, OrderAftercareTaxAdjustmentSupport.safe(request.getPriceDifference())));
        response.put("currencyCode", original.get("currencyCode"));
        response.put("customerBalanceDelta", OrderAftercareTaxAdjustmentSupport.roundCurrency(OrderAftercareTaxAdjustmentSupport.safe(request.getPriceDifference())));
        response.put("balanceMode", OrderAftercareTaxAdjustmentSupport.normalizeNullable(request.getBalanceMode()));
        response.put("oldItemReversal", oldItemReversal);
        response.put("replacementCharge", replacement);
        response.put("netDelta", netDelta);
        return response;
    }

    private Map<String, Object> resolveOriginalLineAmounts(OrderReturnExchangeRequest request) {
        Order order = request.getOrderId() == null ? null : orderRepository.findDetailedById(request.getOrderId()).orElse(null);
        if (order == null || order.getOrderTaxSnapshot() == null) {
            return null;
        }

        OrderTaxSnapshot snapshot = order.getOrderTaxSnapshot();
        Map<String, Object> linePayload = OrderAftercareTaxAdjustmentSupport.findSnapshotLinePayload(snapshot, request.getOrderItemId(), objectMapper);
        if (linePayload.isEmpty()) {
            return null;
        }

        double taxableAmount = OrderAftercareTaxAdjustmentSupport.toDouble(linePayload.get("taxableValue"));
        double gstAmount = OrderAftercareTaxAdjustmentSupport.toDouble(linePayload.get("gstAmount"));
        double grossAmount = OrderAftercareTaxAdjustmentSupport.toDouble(linePayload.get("amountWithTax"));
        if (grossAmount <= 0) {
            grossAmount = OrderAftercareTaxAdjustmentSupport.toDouble(linePayload.get("chargedAmount"));
        }
        if (grossAmount <= 0) {
            grossAmount = taxableAmount + gstAmount;
        }
        double commissionAmount = OrderAftercareTaxAdjustmentSupport.toDouble(linePayload.get("commissionAmount"));
        double commissionGstAmount = OrderAftercareTaxAdjustmentSupport.toDouble(linePayload.get("commissionGstAmount"));
        double snapshotTaxableTotal = OrderAftercareTaxAdjustmentSupport.safe(snapshot.getTotalTaxableValue());
        double snapshotTcsAmount = OrderAftercareTaxAdjustmentSupport.safe(snapshot.getTcsAmount());
        double tcsRatePercentage = OrderAftercareTaxAdjustmentSupport.safe(snapshot.getTcsRatePercentage());
        if (tcsRatePercentage <= 0 && snapshotTaxableTotal > 0) {
            tcsRatePercentage = OrderAftercareTaxAdjustmentSupport.roundPercentage((snapshotTcsAmount / snapshotTaxableTotal) * 100.0);
        }
        double tcsAmount = snapshotTaxableTotal > 0
                ? OrderAftercareTaxAdjustmentSupport.roundCurrency(snapshotTcsAmount * (taxableAmount / snapshotTaxableTotal))
                : 0.0;
        double sellerPayableAmount = OrderAftercareTaxAdjustmentSupport.roundCurrency(grossAmount - commissionAmount - commissionGstAmount - tcsAmount);
        double taxRatePercentage = taxableAmount > 0
                ? OrderAftercareTaxAdjustmentSupport.roundPercentage((gstAmount / taxableAmount) * 100.0)
                : 0.0;

        return OrderAftercareTaxAdjustmentSupport.buildAmountMap(
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
                OrderAftercareTaxAdjustmentSupport.resolveCurrencyCode(order, request.getOrderItemId()),
                taxRatePercentage,
                tcsRatePercentage
        );
    }

    private Map<String, Object> buildReplacementLineAmounts(OrderReturnExchangeRequest request, Map<String, Object> original) {
        if (original == null || original.isEmpty()) {
            return null;
        }

        Long requestedProductId = request.getRequestedNewProductId() != null ? request.getRequestedNewProductId() : request.getProductId();
        Product product = requestedProductId == null ? null : productRepository.findById(requestedProductId).orElse(null);

        int quantity = Math.max(request.getQuantityRequested() == null ? 1 : request.getQuantityRequested(), 1);
        double unitPrice = request.getNewPrice() == null ? (product == null ? 0.0 : product.getSellingPrice()) : request.getNewPrice();
        double pricingInput = Math.max(unitPrice, 0.0) * quantity;
        double taxRatePercentage = OrderAftercareTaxAdjustmentSupport.safe(product == null ? null : product.getTaxPercentage());
        if (taxRatePercentage <= 0) {
            taxRatePercentage = OrderAftercareTaxAdjustmentSupport.toDouble(original.get("taxRatePercentage"));
        }

        String pricingMode = OrderAftercareTaxAdjustmentSupport.normalizePricingMode(product == null ? null : product.getPricingMode());
        double taxableAmount;
        double gstAmount;
        double grossAmount;
        if ("EXCLUSIVE".equals(pricingMode)) {
            taxableAmount = pricingInput;
            gstAmount = taxableAmount * (taxRatePercentage / 100.0);
            grossAmount = taxableAmount + gstAmount;
        } else {
            grossAmount = pricingInput;
            taxableAmount = taxRatePercentage > 0 ? grossAmount / (1 + (taxRatePercentage / 100.0)) : grossAmount;
            gstAmount = grossAmount - taxableAmount;
        }

        double fallbackCommissionAmount = quantity > 0 ? OrderAftercareTaxAdjustmentSupport.toDouble(original.get("commissionAmount")) / quantity : 0.0;
        double commissionPerUnit = product != null && product.getPlatformCommission() != null
                ? Math.max(product.getPlatformCommission(), 0.0)
                : Math.max(fallbackCommissionAmount, 0.0);
        double commissionAmount = commissionPerUnit * quantity;
        double commissionGstAmount = commissionAmount * 0.18;
        double tcsRatePercentage = OrderAftercareTaxAdjustmentSupport.toDouble(original.get("tcsRatePercentage"));
        double tcsAmount = taxableAmount * (tcsRatePercentage / 100.0);
        double sellerPayableAmount = grossAmount - commissionAmount - commissionGstAmount - tcsAmount;
        String currencyCode = product != null && product.getCurrencyCode() != null && !product.getCurrencyCode().isBlank()
                ? product.getCurrencyCode().trim().toUpperCase(java.util.Locale.ROOT)
                : String.valueOf(original.get("currencyCode"));

        return OrderAftercareTaxAdjustmentSupport.buildAmountMap(
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
}
