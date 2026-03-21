package com.example.ecommerce.seller.controller;

import com.example.ecommerce.modal.Seller;
import com.example.ecommerce.order.service.OrderAftercareService;
import com.example.ecommerce.seller.service.SellerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/seller/aftercare")
@PreAuthorize("hasRole('SELLER')")
public class SellerAftercareController {

    private final SellerService sellerService;
    private final OrderAftercareService orderAftercareService;

    @GetMapping("/returns")
    public ResponseEntity<List<Map<String, Object>>> getSellerReturns(
            @RequestHeader("Authorization") String jwt
    ) throws Exception {
        Seller seller = sellerService.getSellerProfile(jwt);
        return ResponseEntity.ok(orderAftercareService.getSellerReturnRequests(seller.getId()));
    }

    @GetMapping("/exchanges")
    public ResponseEntity<List<Map<String, Object>>> getSellerExchanges(
            @RequestHeader("Authorization") String jwt
    ) throws Exception {
        Seller seller = sellerService.getSellerProfile(jwt);
        return ResponseEntity.ok(orderAftercareService.getSellerExchangeRequests(seller.getId()));
    }
}
