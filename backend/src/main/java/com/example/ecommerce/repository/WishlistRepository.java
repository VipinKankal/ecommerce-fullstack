package com.example.ecommerce.repository;

import com.example.ecommerce.modal.Wishlist;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WishlistRepository extends JpaRepository<Wishlist,Long> {
    Wishlist findByUserId(Long userId);
}



