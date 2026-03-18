package com.example.ecommerce.order.service;

import com.example.ecommerce.modal.Product;
import com.example.ecommerce.modal.User;
import com.example.ecommerce.modal.Wishlist;

public interface WishlistService {
    Wishlist createWishlist(User user);
    Wishlist getWishlistByUserId(User user);
    Wishlist addProductToWishlist(User user, Product product);
    Wishlist removeProductFromWishlist(User user, Product product);
}




