package com.example.ecommerce.catalog.controller;

import com.example.ecommerce.common.exceptions.ProductException;
import com.example.ecommerce.common.mapper.ResponseMapper;
import com.example.ecommerce.modal.Product;
import com.example.ecommerce.catalog.response.ProductResponse;
import com.example.ecommerce.catalog.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/products")
public class ProductController {
    private final ProductService productService;

    @GetMapping("/{productId}")
    public ResponseEntity<ProductResponse> getProductById(
           @PathVariable Long productId
    ) throws ProductException {
        Product product = productService.findProductById(productId);
        return ResponseEntity.ok(ResponseMapper.toProductResponse(product));
    }

    @GetMapping("/search")
    public ResponseEntity<List<ProductResponse>> searchProduct(
            @RequestParam(required = false) String query){
        List<Product> product = productService.searchProduct(query);
        return new ResponseEntity<>(ResponseMapper.toProductResponses(product), HttpStatus.OK);
    }

    @GetMapping
    public ResponseEntity<Page<ProductResponse>> getAllProducts(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String brand,
            @RequestParam(required = false) String colors,
            @RequestParam(required = false) String size,
            @RequestParam(required = false) Integer minPrice,
            @RequestParam(required = false) Integer maxPrice,
            @RequestParam(required = false) Integer minDiscount,
            @RequestParam(required = false) String sort,
            @RequestParam(required = false) String stock,
            @RequestParam(defaultValue = "0") Integer pageNumber
    ){
        Page<Product> products = productService.getAllProducts(
                category, brand, colors, size,
                minPrice, maxPrice, minDiscount,
                sort, stock, pageNumber
        );
        Page<ProductResponse> responsePage = new PageImpl<>(
                ResponseMapper.toProductResponses(products.getContent()),
                products.getPageable(),
                products.getTotalElements()
        );
        return new ResponseEntity<>(responsePage, HttpStatus.OK);
    }
}




