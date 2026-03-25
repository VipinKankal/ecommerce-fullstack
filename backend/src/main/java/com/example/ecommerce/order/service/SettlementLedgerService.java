package com.example.ecommerce.order.service;

import com.example.ecommerce.modal.PaymentOrder;
import com.example.ecommerce.order.response.OrderSettlementResponse;
import com.example.ecommerce.order.response.SettlementLedgerEntryResponse;

import java.util.List;

public interface SettlementLedgerService {
    void recordSuccessfulPayment(PaymentOrder paymentOrder) throws Exception;

    List<OrderSettlementResponse> getSellerSettlements(Long sellerId);

    List<OrderSettlementResponse> getAllSettlements();

    List<SettlementLedgerEntryResponse> getSellerLedger(Long sellerId);

    List<SettlementLedgerEntryResponse> getAllLedgerEntries();

    List<SettlementLedgerEntryResponse> getOrderLedgerEntries(Long orderId);
}
