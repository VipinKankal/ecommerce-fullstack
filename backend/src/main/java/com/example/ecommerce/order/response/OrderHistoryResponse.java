package com.example.ecommerce.order.response;
import com.example.ecommerce.common.domain.PaymentMethod;
import com.example.ecommerce.common.domain.PaymentProvider;
import com.example.ecommerce.common.domain.PaymentType;
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
    private String paymentStatus;
    private PaymentMethod paymentMethod;
    private PaymentType paymentType;
    private PaymentProvider provider;
    private Integer totalSellingPrice;
    private Integer totalItems;
    private LocalDateTime orderDate;
    private LocalDateTime deliveredAt;
    private LocalDateTime cancelledAt;
    private String cancelReasonCode;
    private String cancelReasonText;
    private OrderShippingAddressResponse shippingAddress;
    private OrderTaxSnapshotResponse orderTaxSnapshot;
    private List<OrderHistoryItemResponse> orderItems = new ArrayList<>();
}




