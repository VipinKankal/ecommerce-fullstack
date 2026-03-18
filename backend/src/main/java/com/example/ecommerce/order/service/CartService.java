package com.example.ecommerce.order.service;

import com.example.ecommerce.modal.Cart;
import com.example.ecommerce.modal.CartItem;
import com.example.ecommerce.modal.Product;
import com.example.ecommerce.modal.User;

public interface CartService {
    public CartItem addItemToCart(
            User user,
            Product product,
            String size,
            int quantity
    );
    public Cart findUserCart(User user);
}




