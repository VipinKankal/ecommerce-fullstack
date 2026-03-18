package com.example.ecommerce.order.controller;

import com.example.ecommerce.modal.*;
import com.example.ecommerce.common.response.ApiResponse;
import com.example.ecommerce.order.service.PaymentService;
import com.example.ecommerce.order.service.TransactionService;
import com.example.ecommerce.seller.service.SellerReportService;
import com.example.ecommerce.seller.service.SellerService;
import com.example.ecommerce.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/payment")
public class PaymentController {

    private final PaymentService paymentService;
    private final UserService userService;
    private final SellerService sellerService;
    private final SellerReportService sellerReportService;
    private final TransactionService transactionService;

    @GetMapping("/{paymentId}")
    @PreAuthorize("hasAnyRole('CUSTOMER','ADMIN')")
    @Transactional
    public ResponseEntity<ApiResponse> getPaymentSuccessHandler(
            @PathVariable String paymentId,
            @RequestParam String paymentLinkId,
            @RequestHeader("Authorization") String jwt
    ) throws Exception {
        User user = userService.findUserByJwtToken(jwt);
        PaymentOrder paymentOrder = paymentService.getPaymentOrderByPaymentId(paymentLinkId);
        if (paymentOrder.getUser() == null || !paymentOrder.getUser().getId().equals(user.getId())) {
            throw new Exception("Unauthorized payment callback");
        }

        boolean isPaymentSuccessful = paymentService.ProceedPaymentOrder(paymentOrder, paymentId, paymentLinkId);
        if (isPaymentSuccessful) {
            for (Order order : paymentOrder.getOrders()) {
                transactionService.createTransaction(order);
                Seller seller = sellerService.getSellerById(order.getSellerId());
                SellerReport report = sellerReportService.getSellerReport(seller);
                report.setTotalOrders(report.getTotalOrders() + 1);
                report.setTotalEarnings(report.getTotalEarnings() + order.getTotalSellingPrice());
                report.setTotalSales(report.getTotalSales() + order.getOrderItems().size());
                sellerReportService.updateSellerReport(report);
            }
        }

        ApiResponse response = new ApiResponse();
        response.setMessage("Payment successful");
        return new ResponseEntity<>(response, HttpStatus.ACCEPTED);
    }
}
