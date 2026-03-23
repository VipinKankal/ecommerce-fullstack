package com.example.ecommerce.order.response;

import com.example.ecommerce.common.domain.CouponDiscountType;
import com.example.ecommerce.common.domain.CouponScopeType;
import com.example.ecommerce.common.domain.CouponUserEligibilityType;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class CouponResponse {
    private Long id;
    private String code;
    private CouponDiscountType discountType;
    private Double discountValue;
    private Double discountPercentage;
    private Double maxDiscount;
    private Double minimumOrderValue;
    private LocalDate validityStartDate;
    private LocalDate validityEndDate;
    private Integer usageLimit;
    private Integer perUserLimit;
    private Integer usedCount;
    private Integer reservedCount;
    private CouponScopeType scopeType;
    private Long scopeId;
    private boolean firstOrderOnly;
    private CouponUserEligibilityType userEligibilityType;
    private Integer inactiveDaysThreshold;
    private Long mappedUserCount;
    private boolean active;
}
