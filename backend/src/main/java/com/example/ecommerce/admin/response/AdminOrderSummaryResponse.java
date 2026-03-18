package com.example.ecommerce.admin.response;

import com.example.ecommerce.common.domain.OrderStatus;
import com.example.ecommerce.common.domain.PaymentStatus;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class AdminOrderSummaryResponse {
    private Long id;
    private String customerName;
    private String customerEmail;
    private String sellerName;
    private OrderStatus orderStatus;
    private PaymentStatus paymentStatus;
    private Integer totalSellingPrice;
    private Integer totalItems;
    private LocalDateTime orderDate;
}




