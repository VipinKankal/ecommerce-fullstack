package com.example.ecommerce.seller.controller;

import com.example.ecommerce.common.mapper.ResponseMapper;
import com.example.ecommerce.modal.Product;
import com.example.ecommerce.modal.Seller;
import com.example.ecommerce.catalog.request.CreateProductRequest;
import com.example.ecommerce.catalog.request.UpdateProductRequest;
import com.example.ecommerce.catalog.response.ProductResponse;
import com.example.ecommerce.catalog.service.ProductService;
import com.example.ecommerce.seller.service.SellerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/sellers/products")
@PreAuthorize("hasRole('SELLER')")
public class SellerProductController {
    private final ProductService productService;
    private final SellerService sellerService;

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
            @RequestBody CreateProductRequest request,
            @RequestHeader("Authorization") String jwt
    ) throws Exception {
        Seller seller = sellerService.getSellerProfile(jwt);
        Product product = productService.createProduct(request, seller);
        return new ResponseEntity<>(ResponseMapper.toProductResponse(product), HttpStatus.CREATED);
    }

    @DeleteMapping("/{productId}")
    public ResponseEntity<Void> deleteProduct(
            @PathVariable Long productId,
            @RequestHeader("Authorization") String jwt
    ) throws Exception {
        Seller seller = sellerService.getSellerProfile(jwt);
        productService.deleteProduct(productId, seller.getId());
        return new ResponseEntity<>(HttpStatus.OK);
    }

    @PutMapping("/{productId}")
    public ResponseEntity<ProductResponse> updateProduct(
            @PathVariable Long productId,
            @RequestBody UpdateProductRequest incoming,
            @RequestHeader("Authorization") String jwt
    ) throws Exception {
        Seller seller = sellerService.getSellerProfile(jwt);
        Product updatedProduct = productService.updateProduct(productId, incoming, seller.getId());
        return new ResponseEntity<>(ResponseMapper.toProductResponse(updatedProduct), HttpStatus.OK);
    }
}




