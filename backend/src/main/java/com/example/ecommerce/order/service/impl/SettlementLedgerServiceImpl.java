package com.example.ecommerce.order.service.impl;

import com.example.ecommerce.modal.Order;
import com.example.ecommerce.modal.OrderSettlement;
import com.example.ecommerce.modal.OrderTaxSnapshot;
import com.example.ecommerce.modal.PaymentOrder;
import com.example.ecommerce.modal.Product;
import com.example.ecommerce.modal.Seller;
import com.example.ecommerce.modal.SellerReport;
import com.example.ecommerce.modal.SettlementLedgerEntry;
import com.example.ecommerce.order.response.OrderSettlementResponse;
import com.example.ecommerce.order.response.SettlementLedgerEntryResponse;
import com.example.ecommerce.order.service.SettlementLedgerService;
import com.example.ecommerce.repository.OrderSettlementRepository;
import com.example.ecommerce.repository.SellerRepository;
import com.example.ecommerce.repository.SettlementLedgerEntryRepository;
import com.example.ecommerce.seller.service.SellerReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class SettlementLedgerServiceImpl implements SettlementLedgerService {

    private static final String ORDER_TYPE_MARKETPLACE = "MARKETPLACE";
    private static final String ORDER_TYPE_OWN_BRAND = "OWN_BRAND";
    private static final String STATUS_READY_FOR_PAYOUT = "READY_FOR_PAYOUT";
    private static final String STATUS_RETAINED = "RETAINED";
    private static final String DEFAULT_CURRENCY = "INR";

    private final OrderSettlementRepository orderSettlementRepository;
    private final SettlementLedgerEntryRepository settlementLedgerEntryRepository;
    private final SellerRepository sellerRepository;
    private final SellerReportService sellerReportService;

    @Override
    @Transactional
    public void recordSuccessfulPayment(PaymentOrder paymentOrder) throws Exception {
        if (paymentOrder == null || paymentOrder.getOrders() == null || paymentOrder.getOrders().isEmpty()) {
            return;
        }

        List<Order> orders = paymentOrder.getOrders().stream()
                .filter(Objects::nonNull)
                .sorted(Comparator.comparing(Order::getId, Comparator.nullsLast(Long::compareTo)))
                .toList();

        for (Order order : orders) {
            if (order == null || order.getId() == null) {
                continue;
            }
            if (orderSettlementRepository.findByOrderId(order.getId()).isPresent()) {
                continue;
            }

            OrderTaxSnapshot snapshot = order.getOrderTaxSnapshot();
            if (snapshot == null) {
                throw new IllegalArgumentException("Order tax snapshot is required before settlement posting");
            }

            String orderType = normalizeOrderType(snapshot.getOrderType());
            Seller seller = order.getSellerId() == null ? null : sellerRepository.findById(order.getSellerId()).orElse(null);
            String currencyCode = resolveCurrencyCode(order);
            double grossCollectedAmount = firstPositive(
                    snapshot.getTotalAmountWithTax(),
                    snapshot.getTotalAmountCharged(),
                    order.getTotalSellingPrice() == null ? null : order.getTotalSellingPrice().doubleValue()
            );
            double taxableValue = safe(snapshot.getTotalTaxableValue());
            double gstAmount = safe(snapshot.getTotalGstAmount());
            double commissionAmount = safe(snapshot.getTotalCommissionAmount());
            double commissionGstAmount = safe(snapshot.getTotalCommissionGstAmount());
            double tcsRatePercentage = safe(snapshot.getTcsRatePercentage());
            double tcsAmount = safe(snapshot.getTcsAmount());

            OrderSettlement settlement = new OrderSettlement();
            settlement.setOrder(order);
            settlement.setPaymentOrder(paymentOrder);
            settlement.setSeller(seller);
            settlement.setOrderType(orderType);
            settlement.setGrossCollectedAmount(roundCurrency(grossCollectedAmount));
            settlement.setTaxableValue(roundCurrency(taxableValue));
            settlement.setGstAmount(roundCurrency(gstAmount));
            settlement.setCommissionAmount(roundCurrency(commissionAmount));
            settlement.setCommissionGstAmount(roundCurrency(commissionGstAmount));
            settlement.setTcsRatePercentage(roundCurrency(tcsRatePercentage));
            settlement.setTcsAmount(roundCurrency(tcsAmount));
            settlement.setCurrencyCode(currencyCode);

            if (ORDER_TYPE_OWN_BRAND.equals(orderType)) {
                settlement.setSettlementStatus(STATUS_RETAINED);
                settlement.setSellerPayableAmount(0.0);
                settlement.setSellerGstLiabilityAmount(0.0);
                settlement.setAdminRevenueAmount(roundCurrency(taxableValue));
                settlement.setAdminGstLiabilityAmount(roundCurrency(gstAmount));
                settlement.setNotes("Own-brand order retained by admin entity.");
            } else {
                double sellerPayableAmount = Math.max(grossCollectedAmount - commissionAmount - commissionGstAmount - tcsAmount, 0.0);
                settlement.setSettlementStatus(STATUS_READY_FOR_PAYOUT);
                settlement.setSellerPayableAmount(roundCurrency(sellerPayableAmount));
                settlement.setSellerGstLiabilityAmount(roundCurrency(gstAmount));
                settlement.setAdminRevenueAmount(roundCurrency(commissionAmount));
                settlement.setAdminGstLiabilityAmount(roundCurrency(commissionGstAmount + tcsAmount));
                settlement.setNotes("Marketplace payout reserved after commission, commission GST, and TCS deductions.");
            }

            OrderSettlement savedSettlement = orderSettlementRepository.save(settlement);
            List<SettlementLedgerEntry> ledgerEntries = buildLedgerEntries(savedSettlement);
            settlementLedgerEntryRepository.saveAll(ledgerEntries);
            savedSettlement.setLedgerPostedAt(LocalDateTime.now());
            orderSettlementRepository.save(savedSettlement);

            updateSellerReport(savedSettlement, order, seller);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrderSettlementResponse> getSellerSettlements(Long sellerId) {
        return orderSettlementRepository.findBySellerIdOrderByCreatedAtDesc(sellerId).stream()
                .map(this::toSettlementResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrderSettlementResponse> getAllSettlements() {
        return orderSettlementRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::toSettlementResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<SettlementLedgerEntryResponse> getSellerLedger(Long sellerId) {
        return settlementLedgerEntryRepository.findBySellerIdOrderByCreatedAtDesc(sellerId).stream()
                .map(this::toLedgerResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<SettlementLedgerEntryResponse> getAllLedgerEntries() {
        return settlementLedgerEntryRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::toLedgerResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<SettlementLedgerEntryResponse> getOrderLedgerEntries(Long orderId) {
        return settlementLedgerEntryRepository.findByOrderIdOrderByCreatedAtDesc(orderId).stream()
                .map(this::toLedgerResponse)
                .toList();
    }

    private List<SettlementLedgerEntry> buildLedgerEntries(OrderSettlement settlement) {
        List<SettlementLedgerEntry> entries = new ArrayList<>();
        String currencyCode = settlement.getCurrencyCode() == null ? DEFAULT_CURRENCY : settlement.getCurrencyCode();

        if (ORDER_TYPE_OWN_BRAND.equals(settlement.getOrderType())) {
            addEntry(entries, settlement, "PAYMENT_CAPTURE", "DEBIT", "ADMIN_CASH", "Admin Cash / Bank",
                    settlement.getGrossCollectedAmount(), currencyCode, "Customer payment captured");
            addEntry(entries, settlement, "REVENUE", "CREDIT", "OWN_BRAND_REVENUE", "Own Brand Revenue",
                    settlement.getAdminRevenueAmount(), currencyCode, "Own-brand taxable revenue recognized");
            addEntry(entries, settlement, "TAX_PAYABLE", "CREDIT", "OWN_BRAND_GST_PAYABLE", "Own Brand GST Payable",
                    settlement.getAdminGstLiabilityAmount(), currencyCode, "Own-brand GST liability recognized");
            return entries;
        }

        addEntry(entries, settlement, "PAYMENT_CAPTURE", "DEBIT", "ADMIN_CASH", "Admin Cash / Bank",
                settlement.getGrossCollectedAmount(), currencyCode, "Customer payment captured");
        addEntry(entries, settlement, "PAYOUT_RESERVE", "CREDIT", "SELLER_PAYABLE", "Seller Payable",
                settlement.getSellerPayableAmount(), currencyCode, "Seller payout reserved");
        addEntry(entries, settlement, "REVENUE", "CREDIT", "PLATFORM_COMMISSION_REVENUE", "Platform Commission Revenue",
                settlement.getAdminRevenueAmount(), currencyCode, "Marketplace commission earned");
        addEntry(entries, settlement, "TAX_PAYABLE", "CREDIT", "PLATFORM_COMMISSION_GST_PAYABLE", "Commission GST Payable",
                settlement.getCommissionGstAmount(), currencyCode, "GST payable on platform commission");
        addEntry(entries, settlement, "TAX_PAYABLE", "CREDIT", "PLATFORM_TCS_PAYABLE", "TCS Payable",
                settlement.getTcsAmount(), currencyCode, "TCS payable to government");
        addEntry(entries, settlement, "MEMO", "MEMO", "SELLER_OUTPUT_GST_MEMO", "Seller Output GST Memo",
                settlement.getSellerGstLiabilityAmount(), currencyCode, "Seller-side GST liability memo");
        return entries;
    }

    private void addEntry(
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

    private void updateSellerReport(OrderSettlement settlement, Order order, Seller seller) {
        if (seller == null) {
            return;
        }

        SellerReport report = sellerReportService.getSellerReport(seller);
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
        sellerReportService.updateSellerReport(report);
    }

    private OrderSettlementResponse toSettlementResponse(OrderSettlement settlement) {
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

    private SettlementLedgerEntryResponse toLedgerResponse(SettlementLedgerEntry entry) {
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

    private String normalizeOrderType(String orderType) {
        if (orderType == null || orderType.isBlank()) {
            return ORDER_TYPE_MARKETPLACE;
        }
        String normalized = orderType.trim().toUpperCase();
        return ORDER_TYPE_OWN_BRAND.equals(normalized) ? ORDER_TYPE_OWN_BRAND : ORDER_TYPE_MARKETPLACE;
    }

    private String resolveCurrencyCode(Order order) {
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

    private double safe(Double value) {
        return value == null ? 0.0 : value;
    }

    private double firstPositive(Double... values) {
        for (Double value : values) {
            if (value != null && value > 0) {
                return value;
            }
        }
        return 0.0;
    }

    private double roundCurrency(Double value) {
        return BigDecimal.valueOf(value == null ? 0.0 : value)
                .setScale(2, RoundingMode.HALF_UP)
                .doubleValue();
    }

    private long roundWhole(Double value) {
        return Math.round(value == null ? 0.0 : value);
    }
}
