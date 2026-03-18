package com.example.ecommerce.admin.response;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class AdminSalesReportResponse {
    private long totalRevenue;
    private long totalOrders;
    private long deliveredOrders;
    private long cancelledOrders;
    private long totalTransactions;
    private List<MetricItem> topCategories = new ArrayList<>();
    private List<MetricItem> topSellers = new ArrayList<>();

    @Data
    public static class MetricItem {
        private String label;
        private long value;
    }
}




