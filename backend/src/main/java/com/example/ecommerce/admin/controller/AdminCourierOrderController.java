package com.example.ecommerce.admin.controller;

import com.example.ecommerce.admin.response.AdminOrderSummaryResponse;
import com.example.ecommerce.admin.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/courier-orders")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminCourierOrderController {

    private final AdminService adminService;

    @GetMapping
    public ResponseEntity<List<AdminOrderSummaryResponse>> getCourierOrders() {
        return ResponseEntity.ok(adminService.getOrders());
    }
}

