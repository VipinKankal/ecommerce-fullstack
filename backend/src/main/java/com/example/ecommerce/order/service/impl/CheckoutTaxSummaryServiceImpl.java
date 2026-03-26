package com.example.ecommerce.order.service.impl;

import com.example.ecommerce.modal.Address;
import com.example.ecommerce.modal.Cart;
import com.example.ecommerce.modal.CartItem;
import com.example.ecommerce.modal.Product;
import com.example.ecommerce.order.response.CheckoutOrderSummaryResponse;
import com.example.ecommerce.order.service.CheckoutTaxSummaryService;
import com.example.ecommerce.tax.response.TaxRuleResolutionResponse;
import com.example.ecommerce.tax.service.TaxComputationSupport;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CheckoutTaxSummaryServiceImpl implements CheckoutTaxSummaryService {

    private final TaxComputationSupport taxComputationSupport;

    @Override
    public CheckoutOrderSummaryResponse buildSummary(Cart cart, Address shippingAddress) {
        LocalDate effectiveDate = LocalDate.now();
        double totalTaxableAmount = 0.0;
        double totalCgst = 0.0;
        double totalSgst = 0.0;
        double totalIgst = 0.0;
        double totalTax = 0.0;
        List<String> ruleCodes = new ArrayList<>();
        List<String> valueBases = new ArrayList<>();
        List<CheckoutOrderSummaryResponse.OrderItemSummary> orderItems = new ArrayList<>();

        List<CartItem> cartItems = cart.getCartItems().stream()
                .sorted(Comparator.comparing(CartItem::getId, Comparator.nullsLast(Long::compareTo)))
                .toList();

        for (CartItem item : cartItems) {
            CheckoutOrderSummaryResponse.OrderItemSummary summary =
                    new CheckoutOrderSummaryResponse.OrderItemSummary();
            summary.setId(item.getId());
            orderItems.add(summary);

            Product product = item.getProduct();
            double lineAmount = item.getSellingPrice() == null ? 0.0 : item.getSellingPrice();
            int quantity = item.getQuantity() <= 0 ? 1 : item.getQuantity();
            double sellingPricePerPiece = lineAmount / quantity;

            TaxRuleResolutionResponse gstResolution = taxComputationSupport.resolveGstRule(
                    product == null ? null : product.getTaxClass(),
                    product == null ? null : product.getHsnCode(),
                    sellingPricePerPiece,
                    sellingPricePerPiece,
                    effectiveDate
            );
            double appliedRate = gstResolution == null || gstResolution.getAppliedRatePercentage() == null
                    ? Math.max(product == null || product.getTaxPercentage() == null ? 0.0 : product.getTaxPercentage(), 0.0)
                    : gstResolution.getAppliedRatePercentage();
            TaxComputationSupport.TaxAmounts taxAmounts = taxComputationSupport.computeAmounts(
                    product == null ? null : product.getPricingMode(),
                    lineAmount,
                    appliedRate
            );

            String sellerStateCode = taxComputationSupport.resolveSellerStateCode(
                    product == null || product.getSeller() == null ? null : product.getSeller().getGSTIN()
            );
            String posStateCode = taxComputationSupport.resolvePosStateCode(
                    shippingAddress == null ? null : shippingAddress.getState()
            );
            String supplyType = taxComputationSupport.resolveSupplyType(sellerStateCode, posStateCode);

            totalTaxableAmount += taxAmounts.taxableValue();
            totalTax += taxAmounts.gstAmount();
            if ("INTRA_STATE".equalsIgnoreCase(supplyType)) {
                totalCgst += taxAmounts.gstAmount() / 2.0;
                totalSgst += taxAmounts.gstAmount() / 2.0;
            } else if ("INTER_STATE".equalsIgnoreCase(supplyType)) {
                totalIgst += taxAmounts.gstAmount();
            }

            if (gstResolution != null && gstResolution.getRuleCode() != null) {
                ruleCodes.add(gstResolution.getRuleCode());
            }
            if (gstResolution != null && gstResolution.getValueBasis() != null) {
                valueBases.add(gstResolution.getValueBasis());
            }
        }

        CheckoutOrderSummaryResponse.PriceBreakdown priceBreakdown =
                new CheckoutOrderSummaryResponse.PriceBreakdown();
        priceBreakdown.setPlatformFee(0);
        priceBreakdown.setTotalMRP(cart.getTotalMrpPrice());
        priceBreakdown.setTotalSellingPrice((int) Math.round(cart.getTotalSellingPrice()));
        priceBreakdown.setTotalDiscount(cart.getDiscount());
        priceBreakdown.setTaxableAmount(taxComputationSupport.roundCurrency(totalTaxableAmount));
        priceBreakdown.setCgst(taxComputationSupport.roundCurrency(totalCgst));
        priceBreakdown.setSgst(taxComputationSupport.roundCurrency(totalSgst));
        priceBreakdown.setIgst(taxComputationSupport.roundCurrency(totalIgst));
        priceBreakdown.setTotalTax(taxComputationSupport.roundCurrency(totalTax));

        CheckoutOrderSummaryResponse response = new CheckoutOrderSummaryResponse();
        response.setEstimatedDeliveryDate(LocalDate.now().plusDays(5).toString());
        response.setPriceBreakdown(priceBreakdown);
        response.setOrderItems(orderItems);
        response.setAppliedGstRuleVersion(resolveAggregate(ruleCodes));
        response.setEffectiveRuleDate(effectiveDate);
        response.setValueBasis(resolveAggregate(valueBases));
        return response;
    }

    private String resolveAggregate(List<String> values) {
        List<String> normalized = values.stream()
                .filter(value -> value != null && !value.isBlank())
                .map(String::trim)
                .distinct()
                .toList();
        if (normalized.isEmpty()) {
            return null;
        }
        return normalized.size() == 1 ? normalized.get(0) : "MIXED";
    }
}
