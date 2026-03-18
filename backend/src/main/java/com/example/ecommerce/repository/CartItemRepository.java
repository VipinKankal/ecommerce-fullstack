package com.example.ecommerce.repository;

import com.example.ecommerce.modal.Cart;
import com.example.ecommerce.modal.CartItem;
import com.example.ecommerce.modal.Product;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CartItemRepository extends JpaRepository<CartItem, Long> {

    CartItem findByCartAndProductAndSize(
            Cart cart,
            Product product,
            String size
    );
}



