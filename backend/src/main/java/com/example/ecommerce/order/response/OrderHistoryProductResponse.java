package com.example.ecommerce.order.response;

import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
public class OrderHistoryProductResponse {
    private Long id;
    private String title;
    private String description;
    private List<String> images = new ArrayList<>();
}




