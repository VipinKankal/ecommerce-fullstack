package com.example.ecommerce.admin.response;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class AdminProductSummaryResponse {
    private Long id;
    private String title;
    private String categoryName;
    private String sellerName;
    private Integer quantity;
    private Integer sellerStock;
    private Integer warehouseStock;
    private Integer lowStockThreshold;
    private Integer sellingPrice;
    private Integer mrpPrice;
    private LocalDateTime createdAt;
    private java.util.List<VariantSummary> variants;

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




