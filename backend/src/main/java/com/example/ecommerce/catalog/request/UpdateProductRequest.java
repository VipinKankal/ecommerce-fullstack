package com.example.ecommerce.catalog.request;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class UpdateProductRequest {
    private String title;
    private String description;
    private Integer mrpPrice;
    private Integer sellingPrice;
    private Integer quantity;
    private String color;
    private List<String> images;
    private String size;
}




