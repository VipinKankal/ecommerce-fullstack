package com.example.ecommerce.catalog.response;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
public class ProductResponse {
    private Long id;
    private String title;
    private String brand;
    private String description;
    private Integer mrpPrice;
    private Integer sellingPrice;
    private Integer discountPercent;
    private Integer discountPercentage;
    private Integer quantity;
    private Integer sellerStock;
    private Integer warehouseStock;
    private String warrantyType;
    private Integer warrantyDays;
    private String color;
    private List<String> images = new ArrayList<>();
    private Integer numRatings;
    private CategorySummary category;
    private SellerSummary seller;
    private LocalDateTime createdAt;
    private String size;
    private String sizes;
    private Boolean active;
    private List<VariantSummary> variants = new ArrayList<>();

    @Data
    public static class CategorySummary {
        private Long id;
        private String name;
        private String categoryId;
        private Integer level;
    }

    @Data
    public static class SellerSummary {
        private Long id;
        private String sellerName;
        private String email;
    }

    @Data
    public static class VariantSummary {
        private Long id;
        private String variantType;
        private String variantValue;
        private String size;
        private String color;
        private String sku;
        private Integer price;
        private Integer sellerStock;
        private Integer warehouseStock;
    }
}




