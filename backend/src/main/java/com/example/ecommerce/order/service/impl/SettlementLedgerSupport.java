package com.example.ecommerce.order.service.impl;

import com.example.ecommerce.modal.Order;
import com.example.ecommerce.modal.OrderSettlement;
import com.example.ecommerce.modal.Product;
import com.example.ecommerce.modal.SellerReport;
import com.example.ecommerce.modal.SettlementLedgerEntry;
import com.example.ecommerce.order.response.OrderSettlementResponse;
import com.example.ecommerce.order.response.SettlementLedgerEntryResponse;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

final class SettlementLedgerSupport {
    static final String ORDER_TYPE_MARKETPLACE = "MARKETPLACE";
    static final String ORDER_TYPE_OWN_BRAND = "OWN_BRAND";
    static final String STATUS_READY_FOR_PAYOUT = "READY_FOR_PAYOUT";
    static final String STATUS_RETAINED = "RETAINED";
    static final String DEFAULT_CURRENCY = "INR";

    private SettlementLedgerSupport() {
    }

    static List<SettlementLedgerEntry> buildLedgerEntries(OrderSettlement settlement) {
        List<SettlementLedgerEntry> entries = new ArrayList<>();
        String currencyCode = settlement.getCurrencyCode() == null ? DEFAULT_CURRENCY : settlement.getCurrencyCode();

        if (ORDER_TYPE_OWN_BRAND.equals(settlement.getOrderType())) {
            addEntry(entries, settlement, "PAYMENT_CAPTURE", "DEBIT", "ADMIN_CASH", "Admin Cash / Bank", settlement.getGrossCollectedAmount(), currencyCode, "Customer payment captured");
            addEntry(entries, settlement, "REVENUE", "CREDIT", "OWN_BRAND_REVENUE", "Own Brand Revenue", settlement.getAdminRevenueAmount(), currencyCode, "Own-brand taxable revenue recognized");
            addEntry(entries, settlement, "TAX_PAYABLE", "CREDIT", "OWN_BRAND_GST_PAYABLE", "Own Brand GST Payable", settlement.getAdminGstLiabilityAmount(), currencyCode, "Own-brand GST liability recognized");
            return entries;
        }

        addEntry(entries, settlement, "PAYMENT_CAPTURE", "DEBIT", "ADMIN_CASH", "Admin Cash / Bank", settlement.getGrossCollectedAmount(), currencyCode, "Customer payment captured");
        addEntry(entries, settlement, "PAYOUT_RESERVE", "CREDIT", "SELLER_PAYABLE", "Seller Payable", settlement.getSellerPayableAmount(), currencyCode, "Seller payout reserved");
        addEntry(entries, settlement, "REVENUE", "CREDIT", "PLATFORM_COMMISSION_REVENUE", "Platform Commission Revenue", settlement.getAdminRevenueAmount(), currencyCode, "Marketplace commission earned");
        addEntry(entries, settlement, "TAX_PAYABLE", "CREDIT", "PLATFORM_COMMISSION_GST_PAYABLE", "Commission GST Payable", settlement.getCommissionGstAmount(), currencyCode, "GST payable on platform commission");
        addEntry(entries, settlement, "TAX_PAYABLE", "CREDIT", "PLATFORM_TCS_PAYABLE", "TCS Payable", settlement.getTcsAmount(), currencyCode, "TCS payable to government");
        addEntry(entries, settlement, "MEMO", "MEMO", "SELLER_OUTPUT_GST_MEMO", "Seller Output GST Memo", settlement.getSellerGstLiabilityAmount(), currencyCode, "Seller-side GST liability memo");
        return entries;
    }

    static void updateSellerReport(SellerReport report, Order order, OrderSettlement settlement) {
        report.setTotalOrders((report.getTotalOrders() == null ? 0 : report.getTotalOrders()) + 1);
        report.setTotalSales((report.getTotalSales() == null ? 0L : report.getTotalSales())
                + (order.getOrderItems() == null ? 0 : order.getOrderItems().size()));
        report.setTotalTransactions((report.getTotalTransactions() == null ? 0 : report.getTotalTransactions()) + 1);
        report.setTotalEarnings((report.getTotalEarnings() == null ? 0L : report.getTotalEarnings())
                + roundWhole(settlement.getGrossCollectedAmount()));
        report.setTotalTax((report.getTotalTax() == null ? 0L : report.getTotalTax())
                + roundWhole(settlement.getSellerGstLiabilityAmount()));
        report.setNetEarnings((report.getNetEarnings() == null ? 0L : report.getNetEarnings())
                + roundWhole(settlement.getSellerPayableAmount()));
    }

    static OrderSettlementResponse toSettlementResponse(OrderSettlement settlement) {
        OrderSettlementResponse response = new OrderSettlementResponse();
        response.setId(settlement.getId());
        response.setOrderId(settlement.getOrder() == null ? null : settlement.getOrder().getId());
        response.setPaymentOrderId(settlement.getPaymentOrder() == null ? null : settlement.getPaymentOrder().getId());
        response.setSellerId(settlement.getSeller() == null ? null : settlement.getSeller().getId());
        response.setSellerName(settlement.getSeller() == null ? null : settlement.getSeller().getSellerName());
        response.setOrderType(settlement.getOrderType());
        response.setSettlementStatus(settlement.getSettlementStatus());
        response.setGrossCollectedAmount(settlement.getGrossCollectedAmount());
        response.setTaxableValue(settlement.getTaxableValue());
        response.setGstAmount(settlement.getGstAmount());
        response.setCommissionAmount(settlement.getCommissionAmount());
        response.setCommissionGstAmount(settlement.getCommissionGstAmount());
        response.setTcsRatePercentage(settlement.getTcsRatePercentage());
        response.setTcsAmount(settlement.getTcsAmount());
        response.setSellerPayableAmount(settlement.getSellerPayableAmount());
        response.setSellerGstLiabilityAmount(settlement.getSellerGstLiabilityAmount());
        response.setAdminRevenueAmount(settlement.getAdminRevenueAmount());
        response.setAdminGstLiabilityAmount(settlement.getAdminGstLiabilityAmount());
        response.setCurrencyCode(settlement.getCurrencyCode());
        response.setPayoutReference(settlement.getPayoutReference());
        response.setNotes(settlement.getNotes());
        response.setLedgerPostedAt(settlement.getLedgerPostedAt());
        response.setCreatedAt(settlement.getCreatedAt());
        return response;
    }

    static SettlementLedgerEntryResponse toLedgerResponse(SettlementLedgerEntry entry) {
        SettlementLedgerEntryResponse response = new SettlementLedgerEntryResponse();
        response.setId(entry.getId());
        response.setSettlementId(entry.getSettlement() == null ? null : entry.getSettlement().getId());
        response.setOrderId(entry.getOrder() == null ? null : entry.getOrder().getId());
        response.setPaymentOrderId(entry.getPaymentOrder() == null ? null : entry.getPaymentOrder().getId());
        response.setSellerId(entry.getSeller() == null ? null : entry.getSeller().getId());
        response.setSellerName(entry.getSeller() == null ? null : entry.getSeller().getSellerName());
        response.setOrderType(entry.getOrderType());
        response.setEntryGroup(entry.getEntryGroup());
        response.setEntryDirection(entry.getEntryDirection());
        response.setAccountCode(entry.getAccountCode());
        response.setAccountName(entry.getAccountName());
        response.setAmount(entry.getAmount());
        response.setCurrencyCode(entry.getCurrencyCode());
        response.setNote(entry.getNote());
        response.setCreatedAt(entry.getCreatedAt());
        return response;
    }

    static String normalizeOrderType(String orderType) {
        if (orderType == null || orderType.isBlank()) {
            return ORDER_TYPE_MARKETPLACE;
        }
        String normalized = orderType.trim().toUpperCase();
        return ORDER_TYPE_OWN_BRAND.equals(normalized) ? ORDER_TYPE_OWN_BRAND : ORDER_TYPE_MARKETPLACE;
    }

    static String resolveCurrencyCode(Order order) {
        if (order == null || order.getOrderItems() == null) {
            return DEFAULT_CURRENCY;
        }
        return order.getOrderItems().stream()
                .map(item -> item.getProduct())
                .filter(Objects::nonNull)
                .map(Product::getCurrencyCode)
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .findFirst()
                .orElse(DEFAULT_CURRENCY);
    }

    static double safe(Double value) {
        return value == null ? 0.0 : value;
    }

    static double firstPositive(Double... values) {
        for (Double value : values) {
            if (value != null && value > 0) {
                return value;
            }
        }
        return 0.0;
    }

    static double roundCurrency(Double value) {
        return BigDecimal.valueOf(value == null ? 0.0 : value).setScale(2, RoundingMode.HALF_UP).doubleValue();
    }

    static long roundWhole(Double value) {
        return Math.round(value == null ? 0.0 : value);
    }

    private static void addEntry(
            List<SettlementLedgerEntry> entries,
            OrderSettlement settlement,
            String entryGroup,
            String entryDirection,
            String accountCode,
            String accountName,
            Double amount,
            String currencyCode,
            String note
    ) {
        double normalizedAmount = safe(amount);
        if (normalizedAmount <= 0) {
            return;
        }

        SettlementLedgerEntry entry = new SettlementLedgerEntry();
        entry.setSettlement(settlement);
        entry.setOrder(settlement.getOrder());
        entry.setPaymentOrder(settlement.getPaymentOrder());
        entry.setSeller(settlement.getSeller());
        entry.setOrderType(settlement.getOrderType());
        entry.setEntryGroup(entryGroup);
        entry.setEntryDirection(entryDirection);
        entry.setAccountCode(accountCode);
        entry.setAccountName(accountName);
        entry.setAmount(roundCurrency(normalizedAmount));
        entry.setCurrencyCode(currencyCode);
        entry.setNote(note);
        entries.add(entry);
    }
}
