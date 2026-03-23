package com.example.ecommerce.order.request;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CouponApplyRequest {
    private boolean apply = true;
    private String code;
    private Double orderValue;
}
