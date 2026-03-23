package com.example.ecommerce.order.controller;

import com.example.ecommerce.modal.Seller;
import com.example.ecommerce.admin.response.AdminTransactionSummaryResponse;
import com.example.ecommerce.seller.service.SellerService;
import com.example.ecommerce.order.service.TransactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/transactions")
public class TransactionController {
    private final TransactionService transactionService;
    private final SellerService sellerService;

    @GetMapping("/seller")
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<List<AdminTransactionSummaryResponse>> getTransactionBySeller(
            @RequestHeader(value = "Authorization", required = false) String jwt
    ) throws Exception {
        Seller seller = sellerService.getSellerProfile(jwt);
        List<AdminTransactionSummaryResponse> transactions = transactionService.getTransactionBySellerId(seller);
        return ResponseEntity.ok(transactions);
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<AdminTransactionSummaryResponse>> getAllTransactions() {
        List<AdminTransactionSummaryResponse> transactions = transactionService.getAllTransactions();
        return ResponseEntity.ok(transactions);
    }
}





