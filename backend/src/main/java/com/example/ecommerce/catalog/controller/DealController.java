package com.example.ecommerce.catalog.controller;

import com.example.ecommerce.modal.Deal;
import com.example.ecommerce.common.response.ApiResponse;
import com.example.ecommerce.catalog.service.DealService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/admin/deal")
@PreAuthorize("hasRole('ADMIN')")
public class DealController {

     private final DealService dealService;

     @PostMapping
     public ResponseEntity<Deal> cerataDeals(
             @RequestBody Deal deal
     ){
        Deal cerataDeals = dealService.createDeal(deal);
        return new ResponseEntity<>(cerataDeals, HttpStatus.ACCEPTED);
     }

    @PatchMapping("/{id}")
    public ResponseEntity<Deal> updateDeal(
            @PathVariable Long id,
            @RequestBody Deal deal
    ) throws Exception {
        Deal cerataDeals = dealService.updateDeal(deal,id);
        return new ResponseEntity<>(cerataDeals, HttpStatus.ACCEPTED);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse> deleteDeal(
            @PathVariable Long id
    ) throws Exception {
        dealService.deleteDeal(id);
        ApiResponse response = new ApiResponse();
        response.setMessage("deal deleted");

        return new ResponseEntity<>(response,HttpStatus.ACCEPTED);
    }

}




