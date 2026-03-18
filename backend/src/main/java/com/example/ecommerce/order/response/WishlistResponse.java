package com.example.ecommerce.order.response;

import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
public class WishlistResponse {
    private Long id;
    private Long userId;
    private List<WishlistProductResponse> products = new ArrayList<>();
}





