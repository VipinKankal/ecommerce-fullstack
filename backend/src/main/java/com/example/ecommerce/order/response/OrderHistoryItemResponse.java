package com.example.ecommerce.order.response;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class OrderHistoryItemResponse {
    private Long id;
    private String size;
    private int quantity;
    private Integer mrpPrice;
    private Integer sellingPrice;
    private OrderHistoryProductResponse product;
}




