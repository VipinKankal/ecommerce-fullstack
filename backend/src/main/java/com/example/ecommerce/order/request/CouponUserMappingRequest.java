package com.example.ecommerce.order.request;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class CouponUserMappingRequest {

    @NotNull(message = "userIds is required")
    private List<Long> userIds;
}

