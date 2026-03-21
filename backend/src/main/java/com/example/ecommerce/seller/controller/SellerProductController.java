package com.example.ecommerce.seller.controller;

import com.example.ecommerce.common.mapper.ResponseMapper;
import com.example.ecommerce.common.response.ApiResponse;
import com.example.ecommerce.inventory.service.InventoryService;
import com.example.ecommerce.modal.Product;
import com.example.ecommerce.modal.Seller;
import com.example.ecommerce.catalog.request.CreateProductRequest;
import com.example.ecommerce.catalog.request.UpdateProductRequest;
import com.example.ecommerce.catalog.response.ProductResponse;
import com.example.ecommerce.catalog.service.ProductService;
import com.example.ecommerce.seller.service.SellerService;
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
    private final ProductService productService;
    private final SellerService sellerService;
    private final InventoryService inventoryService;

    @GetMapping
    public ResponseEntity<List<ProductResponse>> getProductsBySellerId(
            @RequestHeader("Authorization") String jwt
    ) throws Exception {
        Seller seller = sellerService.getSellerProfile(jwt);
        List<Product> products = productService.getProductBySellerId(seller.getId());
        return new ResponseEntity<>(ResponseMapper.toProductResponses(products), HttpStatus.OK);
    }

    @PostMapping
    public ResponseEntity<ProductResponse> createProduct(
            @Valid @RequestBody CreateProductRequest request,
            @RequestHeader("Authorization") String jwt
    ) throws Exception {
        Seller seller = sellerService.getSellerProfile(jwt);
        Product product = productService.createProduct(request, seller);
        return new ResponseEntity<>(ResponseMapper.toProductResponse(product), HttpStatus.CREATED);
    }

    @DeleteMapping("/{productId}")
    public ResponseEntity<ApiResponse> deleteProduct(
            @PathVariable Long productId,
            @RequestHeader("Authorization") String jwt
    ) throws Exception {
        Seller seller = sellerService.getSellerProfile(jwt);
        productService.deleteProduct(productId, seller.getId());
        ApiResponse response = new ApiResponse();
        response.setMessage("Product deleted successfully");
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @PutMapping("/{productId}")
    public ResponseEntity<ProductResponse> updateProduct(
            @PathVariable Long productId,
            @Valid @RequestBody UpdateProductRequest incoming,
            @RequestHeader("Authorization") String jwt
    ) throws Exception {
        Seller seller = sellerService.getSellerProfile(jwt);
        Product updatedProduct = productService.updateProduct(productId, incoming, seller.getId());
        return new ResponseEntity<>(ResponseMapper.toProductResponse(updatedProduct), HttpStatus.OK);
    }

    @PostMapping("/{productId}/warehouse-transfer")
    public ResponseEntity<ProductResponse> transferStockToWarehouse(
            @PathVariable Long productId,
            @RequestBody(required = false) Map<String, Object> payload,
            @RequestHeader("Authorization") String jwt
    ) throws Exception {
        Seller seller = sellerService.getSellerProfile(jwt);
        Product product = productService.findProductById(productId);
        if (product.getSeller() == null || !seller.getId().equals(product.getSeller().getId())) {
            throw new Exception("Unauthorized product access");
        }

        Object rawQuantity = payload == null ? null : payload.get("quantity");
        int quantity = rawQuantity instanceof Number number
                ? number.intValue()
                : Integer.parseInt(String.valueOf(rawQuantity));

        Product updatedProduct = inventoryService.transferSellerStockToWarehouse(
                product,
                quantity,
                "Seller sent stock to warehouse"
        );
        return new ResponseEntity<>(ResponseMapper.toProductResponse(updatedProduct), HttpStatus.OK);
    }

    @GetMapping("/{productId}/movements")
    public ResponseEntity<List<Map<String, Object>>> getProductMovements(
            @PathVariable Long productId,
            @RequestHeader("Authorization") String jwt
    ) throws Exception {
        Seller seller = sellerService.getSellerProfile(jwt);
        Product product = productService.findProductById(productId);
        if (product.getSeller() == null || !seller.getId().equals(product.getSeller().getId())) {
            throw new Exception("Unauthorized product access");
        }
        return ResponseEntity.ok(inventoryService.getMovementsForProduct(productId));
    }
}
