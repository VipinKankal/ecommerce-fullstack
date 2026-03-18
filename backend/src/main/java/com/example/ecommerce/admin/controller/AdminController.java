package com.example.ecommerce.admin.controller;

import com.example.ecommerce.common.domain.AccountStatus;
import com.example.ecommerce.common.domain.UserRole;
import com.example.ecommerce.common.mapper.ResponseMapper;
import com.example.ecommerce.modal.User;
import com.example.ecommerce.admin.response.AdminDashboardSummaryResponse;
import com.example.ecommerce.admin.response.AdminOrderSummaryResponse;
import com.example.ecommerce.admin.response.AdminProductSummaryResponse;
import com.example.ecommerce.admin.response.AdminSalesReportResponse;
import com.example.ecommerce.admin.response.AdminTransactionSummaryResponse;
import com.example.ecommerce.admin.response.AdminUserSummaryResponse;
import com.example.ecommerce.seller.response.SellerResponse;
import com.example.ecommerce.user.response.UserProfileResponse;
import com.example.ecommerce.admin.service.AdminService;
import com.example.ecommerce.seller.service.SellerService;
import com.example.ecommerce.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {
    private final SellerService sellerService;
    private final UserService userService;
    private final AdminService adminService;

    @GetMapping("/profile")
    public ResponseEntity<UserProfileResponse> getAdminProfile(
            @RequestHeader("Authorization") String jwt
    ) throws Exception {
        User user = userService.findUserByJwtToken(jwt);
        if (user.getRole() != UserRole.ROLE_ADMIN) {
            throw new AccessDeniedException("Admin access required");
        }

        UserProfileResponse response = new UserProfileResponse();
        response.setId(user.getId());
        response.setFullName(user.getFullName());
        response.setEmail(user.getEmail());
        response.setMobileNumber(user.getMobileNumber());
        response.setRole(user.getRole());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/dashboard/summary")
    public ResponseEntity<AdminDashboardSummaryResponse> getDashboardSummary() {
        return ResponseEntity.ok(adminService.getDashboardSummary());
    }

    @GetMapping("/users")
    public ResponseEntity<List<AdminUserSummaryResponse>> getUsers() {
        return ResponseEntity.ok(adminService.getUsers());
    }

    @PatchMapping("/users/{id}/status/{status}")
    public ResponseEntity<AdminUserSummaryResponse> updateUserStatus(
            @PathVariable Long id,
            @PathVariable AccountStatus status
    ) throws Exception {
        return ResponseEntity.ok(adminService.updateUserStatus(id, status));
    }

    @GetMapping("/products")
    public ResponseEntity<List<AdminProductSummaryResponse>> getProducts() {
        return ResponseEntity.ok(adminService.getProducts());
    }

    @GetMapping("/orders")
    public ResponseEntity<List<AdminOrderSummaryResponse>> getOrders() {
        return ResponseEntity.ok(adminService.getOrders());
    }

    @GetMapping("/payments")
    public ResponseEntity<List<AdminTransactionSummaryResponse>> getPayments() {
        return ResponseEntity.ok(adminService.getPayments());
    }

    @GetMapping("/reports/sales")
    public ResponseEntity<AdminSalesReportResponse> getSalesReport() {
        return ResponseEntity.ok(adminService.getSalesReport());
    }

    @PostMapping("/seller/{id}/status/{status}")
    public ResponseEntity<SellerResponse> updateSellerStatus(
            @PathVariable Long id,
            @PathVariable AccountStatus status
    ) throws Exception {
        return ResponseEntity.ok(ResponseMapper.toSellerResponse(sellerService.updateSellerAccountStatus(id, status)));
    }
}




