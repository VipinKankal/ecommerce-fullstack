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
import tools.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OrderTaxSnapshotServiceImpl implements OrderTaxSnapshotService {

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

        List<OrderItem> items = OrderTaxSnapshotSupport.normalizeItems(orderItems);
        if (items.isEmpty()) {
            throw new IllegalArgumentException("Order items are required for tax snapshot freeze");
        }

        LocalDate effectiveDate = OrderTaxSnapshotSupport.resolveEffectiveDate(order);
        String orderType = OrderTaxSnapshotSupport.ORDER_TYPE_MARKETPLACE;
        String invoiceOwner = OrderTaxSnapshotSupport.resolveInvoiceOwner(orderType);
        String liabilityOwner = OrderTaxSnapshotSupport.resolveLiabilityOwner(orderType);
        String supplierGstin = OrderTaxSnapshotSupport.resolveSupplierGstin(items);
        String sellerStateCode = taxComputationSupport.resolveSellerStateCode(supplierGstin);
        String posStateCode = taxComputationSupport.resolvePosStateCode(
                order.getShippingAddress() == null ? null : order.getShippingAddress().getState()
        );
        String supplyType = taxComputationSupport.resolveSupplyType(sellerStateCode, posStateCode);

        List<Double> allocatedDiscounts = OrderTaxSnapshotSupport.allocateDiscounts(items, orderLevelDiscount, taxComputationSupport);
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

        TaxRuleResolutionResponse tcsResolution = taxComputationSupport.resolveTcsRule(totalTaxableValue, supplyType, effectiveDate);
        String gstRuleVersion = OrderTaxSnapshotSupport.resolveAggregateRuleVersion(lineSnapshots.stream().map(LineSnapshot::gstRuleVersion).toList());
        String tcsRuleVersion = tcsResolution == null ? null : tcsResolution.getRuleCode();
        double tcsRatePercentage = tcsResolution == null || tcsResolution.getAppliedRatePercentage() == null ? 0.0 : tcsResolution.getAppliedRatePercentage();
        double tcsAmount = tcsResolution == null || tcsResolution.getTaxAmount() == null ? 0.0 : tcsResolution.getTaxAmount();

        LinkedHashMap<String, Object> payload = new LinkedHashMap<>();
        payload.put("snapshotSource", OrderTaxSnapshotSupport.SNAPSHOT_SOURCE);
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
        payload.put("lineItems", lineSnapshots.stream().map(OrderTaxSnapshotSupport::toLineItemPayload).toList());

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
        snapshot.setSnapshotSource(OrderTaxSnapshotSupport.SNAPSHOT_SOURCE);
        snapshot.setInvoiceOwner(invoiceOwner);
        snapshot.setLiabilityOwner(liabilityOwner);
        snapshot.setEffectiveTaxDate(effectiveDate);
        snapshot.setSnapshotPayload(OrderTaxSnapshotSupport.writePayload(payload, objectMapper));
        snapshot.setFrozenAt(LocalDateTime.now());

        OrderTaxSnapshot savedSnapshot = orderTaxSnapshotRepository.save(snapshot);
        order.setOrderTaxSnapshot(savedSnapshot);
        return savedSnapshot;
    }

    private LineSnapshot buildLineSnapshot(OrderItem item, double allocatedDiscount, LocalDate effectiveDate) {
        Product product = item.getProduct();
        String pricingMode = OrderTaxSnapshotSupport.normalizePricingMode(product == null ? null : product.getPricingMode());
        String taxClass = OrderTaxSnapshotSupport.normalizeTaxClass(product == null ? null : product.getTaxClass());
        String hsnCode = OrderTaxSnapshotSupport.normalizeNullable(product == null ? null : product.getHsnCode());
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
            throw new IllegalStateException("No effective GST rule found for order item " + (item.getId() == null ? "UNKNOWN" : item.getId()));
        }
        double appliedRate = gstResolution.getAppliedRatePercentage();

        TaxComputationSupport.TaxAmounts taxAmounts = taxComputationSupport.computeAmounts(pricingMode, chargedAmount, appliedRate);

        double commissionPerUnit = product == null || product.getPlatformCommission() == null ? 0.0 : Math.max(product.getPlatformCommission(), 0.0);
        double commissionAmount = commissionPerUnit * Math.max(item.getQuantity(), 0);
        double commissionGstAmount = commissionAmount * 0.18;

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
                gstResolution.getRuleCode()
        );
    }

    record LineSnapshot(
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
