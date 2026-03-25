package com.example.ecommerce.order.controller;

import com.example.ecommerce.modal.Seller;
import com.example.ecommerce.order.response.OrderSettlementResponse;
import com.example.ecommerce.order.response.SettlementLedgerEntryResponse;
import com.example.ecommerce.order.service.SettlementLedgerService;
import com.example.ecommerce.seller.service.SellerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/settlements")
public class SettlementController {

    private final SettlementLedgerService settlementLedgerService;
    private final SellerService sellerService;

    @GetMapping("/seller")
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<List<OrderSettlementResponse>> getSellerSettlements(
            @RequestHeader(value = "Authorization", required = false) String jwt
    ) throws Exception {
        Seller seller = sellerService.getSellerProfile(jwt);
        return ResponseEntity.ok(settlementLedgerService.getSellerSettlements(seller.getId()));
    }

    @GetMapping("/seller/ledger")
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<List<SettlementLedgerEntryResponse>> getSellerLedger(
            @RequestHeader(value = "Authorization", required = false) String jwt,
            @RequestParam(required = false) Long orderId
    ) throws Exception {
        Seller seller = sellerService.getSellerProfile(jwt);
        if (orderId != null) {
            return ResponseEntity.ok(
                    settlementLedgerService.getOrderLedgerEntries(orderId).stream()
                            .filter(entry -> seller.getId().equals(entry.getSellerId()))
                            .toList()
            );
        }
        return ResponseEntity.ok(settlementLedgerService.getSellerLedger(seller.getId()));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<OrderSettlementResponse>> getAllSettlements() {
        return ResponseEntity.ok(settlementLedgerService.getAllSettlements());
    }

    @GetMapping("/ledger")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<SettlementLedgerEntryResponse>> getAllLedgerEntries(
            @RequestParam(required = false) Long orderId
    ) {
        if (orderId != null) {
            return ResponseEntity.ok(settlementLedgerService.getOrderLedgerEntries(orderId));
        }
        return ResponseEntity.ok(settlementLedgerService.getAllLedgerEntries());
    }
}
