package com.example.ecommerce.order.response;

import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class CheckoutOrderSummaryResponse {
    private String estimatedDeliveryDate;
    private PriceBreakdown priceBreakdown;
    private List<OrderItemSummary> orderItems;
    private String appliedGstRuleVersion;
    private LocalDate effectiveRuleDate;
    private String valueBasis;

    @Data
    public static class PriceBreakdown {
        private Integer platformFee;
        private Integer totalMRP;
        private Integer totalSellingPrice;
        private Integer totalDiscount;
        private Double taxableAmount;
        private Double cgst;
        private Double sgst;
        private Double igst;
        private Double totalTax;
    }

    @Data
    public static class OrderItemSummary {
        private Long id;
    }
}
