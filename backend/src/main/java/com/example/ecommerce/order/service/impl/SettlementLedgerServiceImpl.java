package com.example.ecommerce.order.service.impl;

import com.example.ecommerce.modal.Order;
import com.example.ecommerce.modal.OrderSettlement;
import com.example.ecommerce.modal.OrderTaxSnapshot;
import com.example.ecommerce.modal.PaymentOrder;
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

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class SettlementLedgerServiceImpl implements SettlementLedgerService {

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

            String orderType = SettlementLedgerSupport.normalizeOrderType(snapshot.getOrderType());
            Seller seller = order.getSellerId() == null ? null : sellerRepository.findById(order.getSellerId()).orElse(null);
            String currencyCode = SettlementLedgerSupport.resolveCurrencyCode(order);
            double grossCollectedAmount = SettlementLedgerSupport.firstPositive(
                    snapshot.getTotalAmountWithTax(),
                    snapshot.getTotalAmountCharged(),
                    order.getTotalSellingPrice() == null ? null : order.getTotalSellingPrice().doubleValue()
            );
            double taxableValue = SettlementLedgerSupport.safe(snapshot.getTotalTaxableValue());
            double gstAmount = SettlementLedgerSupport.safe(snapshot.getTotalGstAmount());
            double commissionAmount = SettlementLedgerSupport.safe(snapshot.getTotalCommissionAmount());
            double commissionGstAmount = SettlementLedgerSupport.safe(snapshot.getTotalCommissionGstAmount());
            double tcsRatePercentage = SettlementLedgerSupport.safe(snapshot.getTcsRatePercentage());
            double tcsAmount = SettlementLedgerSupport.safe(snapshot.getTcsAmount());

            OrderSettlement settlement = new OrderSettlement();
            settlement.setOrder(order);
            settlement.setPaymentOrder(paymentOrder);
            settlement.setSeller(seller);
            settlement.setOrderType(orderType);
            settlement.setGrossCollectedAmount(SettlementLedgerSupport.roundCurrency(grossCollectedAmount));
            settlement.setTaxableValue(SettlementLedgerSupport.roundCurrency(taxableValue));
            settlement.setGstAmount(SettlementLedgerSupport.roundCurrency(gstAmount));
            settlement.setCommissionAmount(SettlementLedgerSupport.roundCurrency(commissionAmount));
            settlement.setCommissionGstAmount(SettlementLedgerSupport.roundCurrency(commissionGstAmount));
            settlement.setTcsRatePercentage(SettlementLedgerSupport.roundCurrency(tcsRatePercentage));
            settlement.setTcsAmount(SettlementLedgerSupport.roundCurrency(tcsAmount));
            settlement.setCurrencyCode(currencyCode);

            if (SettlementLedgerSupport.ORDER_TYPE_OWN_BRAND.equals(orderType)) {
                settlement.setSettlementStatus(SettlementLedgerSupport.STATUS_RETAINED);
                settlement.setSellerPayableAmount(0.0);
                settlement.setSellerGstLiabilityAmount(0.0);
                settlement.setAdminRevenueAmount(SettlementLedgerSupport.roundCurrency(taxableValue));
                settlement.setAdminGstLiabilityAmount(SettlementLedgerSupport.roundCurrency(gstAmount));
                settlement.setNotes("Own-brand order retained by admin entity.");
            } else {
                double sellerPayableAmount = Math.max(grossCollectedAmount - commissionAmount - commissionGstAmount - tcsAmount, 0.0);
                settlement.setSettlementStatus(SettlementLedgerSupport.STATUS_READY_FOR_PAYOUT);
                settlement.setSellerPayableAmount(SettlementLedgerSupport.roundCurrency(sellerPayableAmount));
                settlement.setSellerGstLiabilityAmount(SettlementLedgerSupport.roundCurrency(gstAmount));
                settlement.setAdminRevenueAmount(SettlementLedgerSupport.roundCurrency(commissionAmount));
                settlement.setAdminGstLiabilityAmount(SettlementLedgerSupport.roundCurrency(commissionGstAmount + tcsAmount));
                settlement.setNotes("Marketplace payout reserved after commission, commission GST, and TCS deductions.");
            }

            OrderSettlement savedSettlement = orderSettlementRepository.save(settlement);
            List<SettlementLedgerEntry> ledgerEntries = SettlementLedgerSupport.buildLedgerEntries(savedSettlement);
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
                .map(SettlementLedgerSupport::toSettlementResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrderSettlementResponse> getAllSettlements() {
        return orderSettlementRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(SettlementLedgerSupport::toSettlementResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<SettlementLedgerEntryResponse> getSellerLedger(Long sellerId) {
        return settlementLedgerEntryRepository.findBySellerIdOrderByCreatedAtDesc(sellerId).stream()
                .map(SettlementLedgerSupport::toLedgerResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<SettlementLedgerEntryResponse> getAllLedgerEntries() {
        return settlementLedgerEntryRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(SettlementLedgerSupport::toLedgerResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<SettlementLedgerEntryResponse> getOrderLedgerEntries(Long orderId) {
        return settlementLedgerEntryRepository.findByOrderIdOrderByCreatedAtDesc(orderId).stream()
                .map(SettlementLedgerSupport::toLedgerResponse)
                .toList();
    }

    private void updateSellerReport(OrderSettlement settlement, Order order, Seller seller) {
        if (seller == null) {
            return;
        }

        SellerReport report = sellerReportService.getSellerReport(seller);
        SettlementLedgerSupport.updateSellerReport(report, order, settlement);
        sellerReportService.updateSellerReport(report);
    }
}
