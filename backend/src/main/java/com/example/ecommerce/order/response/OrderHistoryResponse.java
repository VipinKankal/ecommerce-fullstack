package com.example.ecommerce.order.response;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
public class OrderHistoryResponse {
    private Long id;
    private String orderStatus;
    private Integer totalSellingPrice;
    private Integer totalItems;
    private LocalDateTime orderDate;
    private LocalDateTime cancelledAt;
    private String cancelReasonCode;
    private String cancelReasonText;
    private OrderShippingAddressResponse shippingAddress;
    private List<OrderHistoryItemResponse> orderItems = new ArrayList<>();
}




