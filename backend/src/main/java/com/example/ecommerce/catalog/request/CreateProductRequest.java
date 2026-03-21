package com.example.ecommerce.catalog.request;

import com.example.ecommerce.catalog.ProductConstraints;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

@Data
public class CreateProductRequest {
    @NotBlank(message = "Title is required.")
    private String title;

    @Size(max = ProductConstraints.DESCRIPTION_MAX_LENGTH, message = ProductConstraints.DESCRIPTION_MAX_MESSAGE)
    private String description;

    @NotBlank(message = "Brand is required.")
    private String brand;

    private int mrpPrice;
    private int sellingPrice;
    private int quantity;
    private String color;
    private List<String> images;
    private String category;
    private String category2;
    private String category3;
    private String size;
    private String warrantyType;
    private Integer warrantyDays;
    private List<VariantRequest> variants;

    @Data
    public static class VariantRequest {
        private String variantType;
        private String variantValue;
        private String size;
        private String color;
        private String sku;
        private Integer price;
        private Integer quantity;
    }
}
