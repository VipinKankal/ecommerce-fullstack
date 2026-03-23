package com.example.ecommerce.modal;

import com.example.ecommerce.common.domain.CouponDiscountType;
import com.example.ecommerce.common.domain.CouponScopeType;
import com.example.ecommerce.common.domain.CouponUserEligibilityType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToMany;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class Coupon {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    @Column(nullable = false, unique = true)
    private String code;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CouponDiscountType discountType = CouponDiscountType.PERCENT;

    @Column(nullable = false)
    private double discountValue;

    private double discountPercentage;
    private Double maxDiscount;
    private LocalDate validityStartDate;
    private LocalDate validityEndDate;
    private double minimumOrderValue;
    private Integer usageLimit;
    private Integer perUserLimit;
    private Integer usedCount = 0;
    private Integer reservedCount = 0;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CouponScopeType scopeType = CouponScopeType.GLOBAL;
    private Long scopeId;
    private boolean firstOrderOnly = false;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CouponUserEligibilityType userEligibilityType = CouponUserEligibilityType.ALL_USERS;
    private Integer inactiveDaysThreshold;
    private boolean isActive = true;

    @ManyToMany(mappedBy = "usedCoupons")
    private Set<User> userByUsers = new HashSet<>();

}



