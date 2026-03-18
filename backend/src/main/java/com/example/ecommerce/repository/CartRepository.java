package com.example.ecommerce.repository;

 import com.example.ecommerce.modal.Cart;
 import org.springframework.data.jpa.repository.JpaRepository;

public interface CartRepository extends JpaRepository<Cart, Long> {
    Cart findByUserId(Long id);
}



