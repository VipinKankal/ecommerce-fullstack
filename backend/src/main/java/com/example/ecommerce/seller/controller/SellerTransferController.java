package com.example.ecommerce.seller.controller;

import com.example.ecommerce.inventory.response.WarehouseTransferResponse;
import com.example.ecommerce.inventory.service.WarehouseTransferService;
import com.example.ecommerce.modal.Seller;
import com.example.ecommerce.seller.service.SellerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/seller/transfers")
@PreAuthorize("hasRole('SELLER')")
public class SellerTransferController {

    private final SellerService sellerService;
    private final WarehouseTransferService warehouseTransferService;

    @GetMapping
    public ResponseEntity<List<WarehouseTransferResponse>> getTransfers(
            @RequestHeader("Authorization") String jwt
    ) throws Exception {
        Seller seller = sellerService.getSellerProfile(jwt);
        return ResponseEntity.ok(warehouseTransferService.getSellerTransfers(seller.getId()));
    }

    @PostMapping("/{transferId}/cancel")
    public ResponseEntity<WarehouseTransferResponse> cancelTransfer(
            @PathVariable Long transferId,
            @RequestHeader("Authorization") String jwt
    ) throws Exception {
        Seller seller = sellerService.getSellerProfile(jwt);
        return ResponseEntity.ok(warehouseTransferService.cancelTransfer(transferId, seller.getId()));
    }
}
