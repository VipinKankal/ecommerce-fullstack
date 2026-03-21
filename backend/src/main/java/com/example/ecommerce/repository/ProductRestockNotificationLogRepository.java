package com.example.ecommerce.repository;

import com.example.ecommerce.modal.ProductRestockNotificationLog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductRestockNotificationLogRepository extends JpaRepository<ProductRestockNotificationLog, Long> {
}
