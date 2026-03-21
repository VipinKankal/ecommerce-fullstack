package com.example.ecommerce.seller.response;

import com.example.ecommerce.common.domain.OrderStatus;
import com.example.ecommerce.common.domain.PaymentMethod;
import com.example.ecommerce.common.domain.PaymentProvider;
import com.example.ecommerce.common.domain.PaymentStatus;
import com.example.ecommerce.common.domain.PaymentType;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
public class SellerOrderResponse {
    private Long id;
    private String orderId;
    private Long sellerId;
    private OrderStatus orderStatus;
    private PaymentStatus paymentStatus;
    private PaymentMethod paymentMethod;
    private PaymentType paymentType;
    private PaymentProvider provider;
    private Double totalMrpPrice;
    private Integer totalSellingPrice;
    private Double discount;
    private Integer totalItems;
    private String cancelReasonCode;
    private String cancelReasonText;
    private LocalDateTime cancelledAt;
    private LocalDateTime orderDate;
    private LocalDateTime deliveryDate;
    private LocalDateTime deliveredAt;
    private CustomerSummary user;
    private AddressSummary shippingAddress;
    private List<OrderItemSummary> orderItems = new ArrayList<>();

    @Data
    public static class CustomerSummary {
        private Long id;
        private String fullName;
        private String email;
        private String mobileNumber;
    }

    @Data
    public static class AddressSummary {
        private Long id;
        private String name;
        private String street;
        private String locality;
        private String address;
        private String city;
        private String state;
        private String pinCode;
        private String mobileNumber;
        private String country;
    }

    @Data
    public static class ProductSummary {
        private Long id;
        private String title;
        private String description;
        private String color;
        private List<String> images = new ArrayList<>();
    }

    @Data
    public static class OrderItemSummary {
        private Long id;
        private ProductSummary product;
        private String size;
        private Integer quantity;
        private Integer mrpPrice;
        private Integer sellingPrice;
        private Long userId;
    }
}




