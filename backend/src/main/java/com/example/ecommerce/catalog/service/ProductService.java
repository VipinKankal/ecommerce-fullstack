package com.example.ecommerce.catalog.service;

import com.example.ecommerce.common.exceptions.ProductException;
import com.example.ecommerce.modal.Product;
import com.example.ecommerce.modal.Seller;
import com.example.ecommerce.catalog.request.CreateProductRequest;
import com.example.ecommerce.catalog.request.UpdateProductRequest;
import org.springframework.data.domain.Page;

import java.util.List;

public interface ProductService {

    public Product createProduct(CreateProductRequest request, Seller seller);
    public void deleteProduct(Long productId, Long sellerId) throws ProductException;
    public Product updateProduct(Long productId, UpdateProductRequest request, Long sellerId) throws ProductException;
    Product findProductById(Long productId) throws ProductException;
    List<Product> searchProduct(String query);
    public Page<Product> getAllProducts(
            String category,
            String brand,
            String colors,
            String size,
            Integer minPrice,
            Integer maxPrice,
            Integer minDiscount,
            String sort,
            String stock,
            Integer pageNumber
    );
    List<Product>getProductBySellerId(Long sellerId);
}





