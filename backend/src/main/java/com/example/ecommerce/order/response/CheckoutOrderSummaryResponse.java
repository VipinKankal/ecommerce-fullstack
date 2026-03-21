package com.example.ecommerce.order.response;

import lombok.Data;

import java.util.List;

@Data
public class CheckoutOrderSummaryResponse {
    private String estimatedDeliveryDate;
    private PriceBreakdown priceBreakdown;
    private List<OrderItemSummary> orderItems;

    @Data
    public static class PriceBreakdown {
        private Integer platformFee;
        private Integer totalMRP;
        private Integer totalSellingPrice;
        private Integer totalDiscount;
    }

    @Data
    public static class OrderItemSummary {
        private Long id;
    }
}
