package com.example.ecommerce.admin.response;

import lombok.Data;

@Data
public class AdminDashboardSummaryResponse {
    private long totalUsers;
    private long totalSellers;
    private long activeSellers;
    private long pendingSellers;
    private long totalProducts;
    private long totalOrders;
    private long totalTransactions;
    private long grossMerchandiseValue;
}




