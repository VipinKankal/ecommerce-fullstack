package com.example.ecommerce.admin.service;

import com.example.ecommerce.common.domain.AccountStatus;
import com.example.ecommerce.admin.response.AdminDashboardSummaryResponse;
import com.example.ecommerce.admin.response.AdminOrderSummaryResponse;
import com.example.ecommerce.admin.response.AdminProductSummaryResponse;
import com.example.ecommerce.admin.response.AdminSalesReportResponse;
import com.example.ecommerce.admin.response.AdminTransactionSummaryResponse;
import com.example.ecommerce.admin.response.AdminUserSummaryResponse;

import java.util.List;

public interface AdminService {
    AdminDashboardSummaryResponse getDashboardSummary();
    List<AdminUserSummaryResponse> getUsers();
    AdminUserSummaryResponse updateUserStatus(Long id, AccountStatus status) throws Exception;
    List<AdminProductSummaryResponse> getProducts();
    List<AdminOrderSummaryResponse> getOrders();
    List<AdminTransactionSummaryResponse> getPayments();
    AdminSalesReportResponse getSalesReport();
}




