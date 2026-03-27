package com.example.ecommerce.order.service.impl;

import com.example.ecommerce.modal.Order;
import com.example.ecommerce.modal.OrderItem;
import com.example.ecommerce.modal.OrderTaxSnapshot;
import com.example.ecommerce.modal.Product;
import com.example.ecommerce.modal.Seller;
import com.example.ecommerce.order.service.OrderTaxSnapshotService;
import com.example.ecommerce.repository.OrderTaxSnapshotRepository;
import com.example.ecommerce.tax.response.TaxRuleResolutionResponse;
import com.example.ecommerce.tax.service.TaxComputationSupport;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class OrderTaxSnapshotServiceImpl implements OrderTaxSnapshotService {

    private static final String ORDER_TYPE_MARKETPLACE = "MARKETPLACE";
    private static final String ORDER_TYPE_OWN_BRAND = "OWN_BRAND";
    private static final String SNAPSHOT_SOURCE = "ORDER_CREATE_FREEZE_V1";
    private static final String DEFAULT_PRICING_MODE = "INCLUSIVE";
    private static final String DEFAULT_TAX_CLASS = "APPAREL_STANDARD";
    private static final String OWNER_SELLER = "SELLER";
    private static final String OWNER_ADMIN = "ADMIN";

    private final OrderTaxSnapshotRepository orderTaxSnapshotRepository;
    private final TaxComputationSupport taxComputationSupport;
    private final ObjectMapper objectMapper;

    @Override
    public OrderTaxSnapshot freezeSnapshot(Order order, List<OrderItem> orderItems, double orderLevelDiscount) {
        if (order == null || order.getId() == null) {
            throw new IllegalArgumentException("Order must be persisted before tax snapshot freeze");
        }
        if (orderTaxSnapshotRepository.findByOrderId(order.getId()).isPresent()) {
            throw new IllegalStateException("Order tax snapshot already frozen");
        }

        List<OrderItem> items = orderItems == null ? List.of() : orderItems.stream()
                .filter(Objects::nonNull)
                .toList();
        if (items.isEmpty()) {
            throw new IllegalArgumentException("Order items are required for tax snapshot freeze");
        }

        LocalDate effectiveDate = resolveEffectiveDate(order);
        String orderType = ORDER_TYPE_MARKETPLACE;
        String invoiceOwner = resolveInvoiceOwner(orderType);
        String liabilityOwner = resolveLiabilityOwner(orderType);
        String supplierGstin = resolveSupplierGstin(items);
        String sellerStateCode = taxComputationSupport.resolveSellerStateCode(supplierGstin);
        String posStateCode = taxComputationSupport.resolvePosStateCode(
                order.getShippingAddress() == null ? null : order.getShippingAddress().getState()
        );
        String supplyType = taxComputationSupport.resolveSupplyType(sellerStateCode, posStateCode);

        List<Double> allocatedDiscounts = allocateDiscounts(items, orderLevelDiscount);
        List<LineSnapshot> lineSnapshots = new ArrayList<>();
        for (int index = 0; index < items.size(); index++) {
            lineSnapshots.add(buildLineSnapshot(items.get(index), allocatedDiscounts.get(index), effectiveDate));
        }

        double totalTaxableValue = lineSnapshots.stream().mapToDouble(LineSnapshot::taxableValue).sum();
        double totalGstAmount = lineSnapshots.stream().mapToDouble(LineSnapshot::gstAmount).sum();
        double totalAmountCharged = lineSnapshots.stream().mapToDouble(LineSnapshot::chargedAmount).sum();
        double totalAmountWithTax = lineSnapshots.stream().mapToDouble(LineSnapshot::amountWithTax).sum();
        double totalCommissionAmount = lineSnapshots.stream().mapToDouble(LineSnapshot::commissionAmount).sum();
        double totalCommissionGstAmount = lineSnapshots.stream().mapToDouble(LineSnapshot::commissionGstAmount).sum();

        TaxRuleResolutionResponse tcsResolution = taxComputationSupport.resolveTcsRule(
                totalTaxableValue,
                supplyType,
                effectiveDate
        );
        String gstRuleVersion = resolveAggregateRuleVersion(lineSnapshots.stream().map(LineSnapshot::gstRuleVersion).toList());
        String tcsRuleVersion = tcsResolution == null ? null : tcsResolution.getRuleCode();
        double tcsRatePercentage = tcsResolution == null || tcsResolution.getAppliedRatePercentage() == null
                ? 0.0
                : tcsResolution.getAppliedRatePercentage();
        double tcsAmount = tcsResolution == null || tcsResolution.getTaxAmount() == null
                ? 0.0
                : tcsResolution.getTaxAmount();

        LinkedHashMap<String, Object> payload = new LinkedHashMap<>();
        payload.put("snapshotSource", SNAPSHOT_SOURCE);
        payload.put("orderType", orderType);
        payload.put("invoiceOwner", invoiceOwner);
        payload.put("liabilityOwner", liabilityOwner);
        payload.put("supplierGstin", supplierGstin);
        payload.put("sellerStateCode", sellerStateCode);
        payload.put("posStateCode", posStateCode);
        payload.put("supplyType", supplyType);
        payload.put("effectiveDate", effectiveDate.toString());
        payload.put("sourceOrderTotalSellingPrice", order.getTotalSellingPrice());
        payload.put("sourceOrderDiscount", orderLevelDiscount);
        payload.put("totalTaxableValue", taxComputationSupport.roundCurrency(totalTaxableValue));
        payload.put("totalGstAmount", taxComputationSupport.roundCurrency(totalGstAmount));
        payload.put("totalAmountCharged", taxComputationSupport.roundCurrency(totalAmountCharged));
        payload.put("totalAmountWithTax", taxComputationSupport.roundCurrency(totalAmountWithTax));
        payload.put("totalCommissionAmount", taxComputationSupport.roundCurrency(totalCommissionAmount));
        payload.put("totalCommissionGstAmount", taxComputationSupport.roundCurrency(totalCommissionGstAmount));
        payload.put("tcsRatePercentage", taxComputationSupport.roundCurrency(tcsRatePercentage));
        payload.put("tcsAmount", taxComputationSupport.roundCurrency(tcsAmount));
        payload.put("gstRuleVersion", gstRuleVersion);
        payload.put("tcsRuleVersion", tcsRuleVersion);
        payload.put("lineItems", lineSnapshots.stream().map(this::toLineItemPayload).toList());

        OrderTaxSnapshot snapshot = new OrderTaxSnapshot();
        snapshot.setOrder(order);
        snapshot.setOrderType(orderType);
        snapshot.setSupplierGstin(supplierGstin);
        snapshot.setSellerStateCode(sellerStateCode);
        snapshot.setPosStateCode(posStateCode);
        snapshot.setSupplyType(supplyType);
        snapshot.setTotalTaxableValue(taxComputationSupport.roundCurrency(totalTaxableValue));
        snapshot.setTotalGstAmount(taxComputationSupport.roundCurrency(totalGstAmount));
        snapshot.setTotalAmountCharged(taxComputationSupport.roundCurrency(totalAmountCharged));
        snapshot.setTotalAmountWithTax(taxComputationSupport.roundCurrency(totalAmountWithTax));
        snapshot.setTotalCommissionAmount(taxComputationSupport.roundCurrency(totalCommissionAmount));
        snapshot.setTotalCommissionGstAmount(taxComputationSupport.roundCurrency(totalCommissionGstAmount));
        snapshot.setTcsRatePercentage(taxComputationSupport.roundCurrency(tcsRatePercentage));
        snapshot.setTcsAmount(taxComputationSupport.roundCurrency(tcsAmount));
        snapshot.setGstRuleVersion(gstRuleVersion);
        snapshot.setTcsRuleVersion(tcsRuleVersion);
        snapshot.setSnapshotSource(SNAPSHOT_SOURCE);
        snapshot.setInvoiceOwner(invoiceOwner);
        snapshot.setLiabilityOwner(liabilityOwner);
        snapshot.setEffectiveTaxDate(effectiveDate);
        snapshot.setSnapshotPayload(writePayload(payload));
        snapshot.setFrozenAt(LocalDateTime.now());

        OrderTaxSnapshot savedSnapshot = orderTaxSnapshotRepository.save(snapshot);
        order.setOrderTaxSnapshot(savedSnapshot);
        return savedSnapshot;
    }

    private LineSnapshot buildLineSnapshot(OrderItem item, double allocatedDiscount, LocalDate effectiveDate) {
        Product product = item.getProduct();
        String pricingMode = normalizePricingMode(product == null ? null : product.getPricingMode());
        String taxClass = normalizeTaxClass(product == null ? null : product.getTaxClass());
        String hsnCode = normalizeNullable(product == null ? null : product.getHsnCode());
        double originalLineAmount = item.getSellingPrice() == null ? 0.0 : item.getSellingPrice();
        double chargedAmount = Math.max(originalLineAmount - allocatedDiscount, 0.0);
        double provisionalTaxableValue = chargedAmount;
        int quantity = Math.max(item.getQuantity(), 1);
        double sellingPricePerPiece = chargedAmount / quantity;

        TaxRuleResolutionResponse gstResolution = taxComputationSupport.resolveGstRule(
                taxClass,
                hsnCode,
                provisionalTaxableValue,
                sellingPricePerPiece,
                effectiveDate
        );
        if (gstResolution == null || gstResolution.getAppliedRatePercentage() == null) {
            throw new IllegalStateException(
                    "No effective GST rule found for order item " + (item.getId() == null ? "UNKNOWN" : item.getId())
            );
        }
        double appliedRate = gstResolution.getAppliedRatePercentage();

        TaxComputationSupport.TaxAmounts taxAmounts = taxComputationSupport.computeAmounts(
                pricingMode,
                chargedAmount,
                appliedRate
        );

        double commissionPerUnit = product == null || product.getPlatformCommission() == null
                ? 0.0
                : Math.max(product.getPlatformCommission(), 0.0);
        double commissionAmount = commissionPerUnit * Math.max(item.getQuantity(), 0);
        double commissionGstAmount = commissionAmount * 0.18;
        String appliedRuleVersion = gstResolution.getRuleCode();

        return new LineSnapshot(
                item.getId(),
                product == null ? null : product.getId(),
                product == null ? null : product.getTitle(),
                item.getQuantity(),
                hsnCode,
                taxClass,
                pricingMode,
                taxComputationSupport.roundCurrency(appliedRate),
                taxComputationSupport.roundCurrency(originalLineAmount),
                taxComputationSupport.roundCurrency(allocatedDiscount),
                taxComputationSupport.roundCurrency(chargedAmount),
                taxAmounts.taxableValue(),
                taxComputationSupport.roundCurrency(appliedRate),
                taxAmounts.gstAmount(),
                taxAmounts.amountWithTax(),
                taxComputationSupport.roundCurrency(commissionAmount),
                taxComputationSupport.roundCurrency(commissionGstAmount),
                appliedRuleVersion
        );
    }

    private LocalDate resolveEffectiveDate(Order order) {
        LocalDate resolvedDate = order.getOrderDate() == null ? LocalDate.now() : order.getOrderDate().toLocalDate();
        if (resolvedDate.isAfter(LocalDate.now())) {
            throw new IllegalArgumentException("Order date cannot be in the future for tax snapshot freeze");
        }
        return resolvedDate;
    }

    private List<Double> allocateDiscounts(List<OrderItem> items, double orderLevelDiscount) {
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

    private String resolveSupplierGstin(List<OrderItem> items) {
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

    private String resolveAggregateRuleVersion(List<String> ruleVersions) {
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

    private Map<String, Object> toLineItemPayload(LineSnapshot lineSnapshot) {
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

    private String writePayload(Map<String, Object> payload) {
        try {
            return objectMapper.writeValueAsString(payload);
        } catch (JacksonException exception) {
            throw new IllegalStateException("Unable to serialize order tax snapshot payload");
        }
    }

    private String normalizePricingMode(String pricingMode) {
        if (pricingMode == null || pricingMode.isBlank()) {
            return DEFAULT_PRICING_MODE;
        }
        String normalized = pricingMode.trim().toUpperCase();
        return "EXCLUSIVE".equals(normalized) ? "EXCLUSIVE" : DEFAULT_PRICING_MODE;
    }

    private String normalizeTaxClass(String taxClass) {
        if (taxClass == null || taxClass.isBlank()) {
            return DEFAULT_TAX_CLASS;
        }
        return taxClass.trim().toUpperCase();
    }

    private String normalizeNullable(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isBlank() ? null : trimmed.toUpperCase();
    }

    private String resolveInvoiceOwner(String orderType) {
        if (ORDER_TYPE_OWN_BRAND.equalsIgnoreCase(orderType)) {
            return OWNER_ADMIN;
        }
        return OWNER_SELLER;
    }

    private String resolveLiabilityOwner(String orderType) {
        if (ORDER_TYPE_OWN_BRAND.equalsIgnoreCase(orderType)) {
            return OWNER_ADMIN;
        }
        return OWNER_SELLER;
    }

    private record LineSnapshot(
            Long orderItemId,
            Long productId,
            String productTitle,
            Integer quantity,
            String hsnCode,
            String taxClass,
            String pricingMode,
            Double declaredTaxPercentage,
            Double originalLineAmount,
            Double allocatedDiscount,
            Double chargedAmount,
            Double taxableValue,
            Double appliedGstRatePercentage,
            Double gstAmount,
            Double amountWithTax,
            Double commissionAmount,
            Double commissionGstAmount,
            String gstRuleVersion
    ) {
    }
}

