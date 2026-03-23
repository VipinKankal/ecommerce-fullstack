package com.example.ecommerce.order.request;

import com.example.ecommerce.common.domain.CouponDiscountType;
import com.example.ecommerce.common.domain.CouponScopeType;
import com.example.ecommerce.common.domain.CouponUserEligibilityType;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class UpdateCouponRequest {

    @NotBlank(message = "Coupon code is required")
    private String code;

    @NotNull(message = "Discount type is required")
    private CouponDiscountType discountType;

    @NotNull(message = "Discount value is required")
    @DecimalMin(value = "0.01", message = "Discount value must be greater than 0")
    private Double discountValue;

    @DecimalMin(value = "0.0", message = "Max discount cannot be negative")
    private Double maxDiscount;

    @NotNull(message = "Minimum order value is required")
    @DecimalMin(value = "0.0", message = "Minimum order value cannot be negative")
    private Double minimumOrderValue;

    @NotNull(message = "Start date is required")
    private LocalDate validityStartDate;

    @NotNull(message = "End date is required")
    private LocalDate validityEndDate;

    @Min(value = 1, message = "Usage limit must be at least 1")
    private Integer usageLimit;

    @Min(value = 1, message = "Per user limit must be at least 1")
    private Integer perUserLimit;

    private Boolean active;

    @NotNull(message = "Scope type is required")
    private CouponScopeType scopeType = CouponScopeType.GLOBAL;

    private Long scopeId;

    private Boolean firstOrderOnly;

    private CouponUserEligibilityType userEligibilityType = CouponUserEligibilityType.ALL_USERS;

    @Min(value = 1, message = "Inactive days threshold must be at least 1")
    private Integer inactiveDaysThreshold;

    @DecimalMax(value = "100.0", message = "Percent discount cannot exceed 100")
    @DecimalMin(value = "0.0", message = "Percent discount cannot be negative")
    private Double discountPercentage;
}
