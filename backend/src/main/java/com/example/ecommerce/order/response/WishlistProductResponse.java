package com.example.ecommerce.order.response;

import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
public class WishlistProductResponse {
    private Long id;
    private String title;
    private String description;
    private Integer mrpPrice;
    private Integer sellingPrice;
    private Integer discountPercentage;
    private String color;
    private String size;
    private Integer quantity;
    private Integer numRatings;
    private String categoryId;
    private String categoryName;
    private List<String> images = new ArrayList<>();
}





