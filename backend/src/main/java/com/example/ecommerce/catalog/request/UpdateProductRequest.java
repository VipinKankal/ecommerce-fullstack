package com.example.ecommerce.catalog.request;

import com.example.ecommerce.catalog.ProductConstraints;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class UpdateProductRequest {
    private String title;

    @Size(max = ProductConstraints.DESCRIPTION_MAX_LENGTH, message = ProductConstraints.DESCRIPTION_MAX_MESSAGE)
    private String description;

    @Size(max = 120, message = "Brand must be 120 characters or fewer.")
    private String brand;

    private Integer mrpPrice;
    private Integer sellingPrice;
    private Integer quantity;
    private String color;
    private List<String> images;
    private String size;
    private String hsnCode;
    private String pricingMode;
    private String taxClass;
    private String taxRuleVersion;
    private Double taxPercentage;
    private Double costPrice;
    private Double platformCommission;
    private String currency;
    private String warrantyType;
    private Integer warrantyDays;
    private Integer lowStockThreshold;
    private Boolean active;
}
