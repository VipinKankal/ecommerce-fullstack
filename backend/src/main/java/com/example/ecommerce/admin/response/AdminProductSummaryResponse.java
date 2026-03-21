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
    private Integer sellingPrice;
    private Integer mrpPrice;
    private LocalDateTime createdAt;
}




