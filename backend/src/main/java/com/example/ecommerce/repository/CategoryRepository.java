package com.example.ecommerce.repository;

import com.example.ecommerce.modal.Category;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CategoryRepository extends JpaRepository<Category,Long> {

    Category findByCategoryId(String categoryId);
}


