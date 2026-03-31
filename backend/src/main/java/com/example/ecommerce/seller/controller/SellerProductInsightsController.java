package com.example.ecommerce.seller.controller;

import com.example.ecommerce.seller.usecase.SellerProductUseCase;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/sellers/products")
@PreAuthorize("hasRole('SELLER')")
public class SellerProductInsightsController {

    private final SellerProductUseCase sellerProductUseCase;

    @GetMapping("/{productId}/movements")
    public ResponseEntity<List<Map<String, Object>>> getProductMovements(
            @PathVariable Long productId,
            @RequestHeader(value = "Authorization", required = false) String jwt
    ) throws Exception {
        return ResponseEntity.ok(sellerProductUseCase.getProductMovements(productId, jwt));
    }

    @GetMapping("/demand")
    public ResponseEntity<Map<String, Object>> getSellerDemandInsights(
            @RequestHeader(value = "Authorization", required = false) String jwt
    ) throws Exception {
        return ResponseEntity.ok(sellerProductUseCase.getSellerDemandInsights(jwt));
    }
}

