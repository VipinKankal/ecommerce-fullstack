package com.example.ecommerce.seller.controller;

import com.example.ecommerce.common.mapper.ResponseMapper;
import com.example.ecommerce.common.response.ApiResponse;
import com.example.ecommerce.catalog.request.CreateProductRequest;
import com.example.ecommerce.catalog.request.UpdateProductRequest;
import com.example.ecommerce.catalog.response.ProductResponse;
import com.example.ecommerce.seller.usecase.SellerProductUseCase;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/sellers/products")
@PreAuthorize("hasRole('SELLER')")
public class SellerProductController {
    private final SellerProductUseCase sellerProductUseCase;

    @GetMapping
    public ResponseEntity<List<ProductResponse>> getProductsBySellerId(
            @RequestHeader(value = "Authorization", required = false) String jwt
    ) throws Exception {
        return ResponseEntity.ok(ResponseMapper.toProductResponses(sellerProductUseCase.getProductsForSeller(jwt)));
    }

    @PostMapping
    public ResponseEntity<ProductResponse> createProduct(
            @Valid @RequestBody CreateProductRequest request,
            @RequestHeader(value = "Authorization", required = false) String jwt
    ) throws Exception {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ResponseMapper.toProductResponse(sellerProductUseCase.createProduct(request, jwt)));
    }

    @DeleteMapping("/{productId}")
    public ResponseEntity<ApiResponse> deleteProduct(
            @PathVariable Long productId,
            @RequestHeader(value = "Authorization", required = false) String jwt
    ) throws Exception {
        sellerProductUseCase.deleteProduct(productId, jwt);
        ApiResponse response = new ApiResponse();
        response.setMessage("Product deleted successfully");
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{productId}")
    public ResponseEntity<ProductResponse> updateProduct(
            @PathVariable Long productId,
            @Valid @RequestBody UpdateProductRequest incoming,
            @RequestHeader(value = "Authorization", required = false) String jwt
    ) throws Exception {
        return ResponseEntity.ok(
                ResponseMapper.toProductResponse(sellerProductUseCase.updateProduct(productId, incoming, jwt))
        );
    }

    @PatchMapping("/{productId}/active")
    public ResponseEntity<ProductResponse> updateProductActiveState(
            @PathVariable Long productId,
            @RequestBody Map<String, Object> payload,
            @RequestHeader(value = "Authorization", required = false) String jwt
    ) throws Exception {
        return ResponseEntity.ok(
                ResponseMapper.toProductResponse(sellerProductUseCase.updateProductActiveState(productId, payload, jwt))
        );
    }

    @PostMapping("/{productId}/warehouse-transfer")
    public ResponseEntity<ProductResponse> transferStockToWarehouse(
            @PathVariable Long productId,
            @RequestBody(required = false) Map<String, Object> payload,
            @RequestHeader(value = "Authorization", required = false) String jwt
    ) throws Exception {
        return ResponseEntity.ok(
                ResponseMapper.toProductResponse(sellerProductUseCase.transferStockToWarehouse(productId, payload, jwt))
        );
    }
}

