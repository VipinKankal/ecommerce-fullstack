package com.example.ecommerce.repository;

import com.example.ecommerce.modal.PaymentOrder;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentOrderRepository extends JpaRepository<PaymentOrder, Long> {
 PaymentOrder findByPaymentLinkId(String paymentId);
}



