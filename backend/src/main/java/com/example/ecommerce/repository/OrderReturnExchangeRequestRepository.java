package com.example.ecommerce.repository;

import com.example.ecommerce.modal.OrderReturnExchangeRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OrderReturnExchangeRequestRepository extends JpaRepository<OrderReturnExchangeRequest, Long> {
    List<OrderReturnExchangeRequest> findByCustomerIdOrderByRequestedAtDesc(Long customerId);

    List<OrderReturnExchangeRequest> findByCustomerIdAndRequestTypeOrderByRequestedAtDesc(
            Long customerId,
            String requestType
    );

    List<OrderReturnExchangeRequest> findByRequestTypeOrderByRequestedAtDesc(String requestType);

    List<OrderReturnExchangeRequest> findByOrderItemIdAndRequestTypeOrderByRequestedAtDesc(
            Long orderItemId,
            String requestType
    );
}
