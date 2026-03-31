package com.example.ecommerce.order.controller;

import com.example.ecommerce.order.response.OrderHistoryItemResponse;
import com.example.ecommerce.order.response.OrderHistoryResponse;
import com.example.ecommerce.order.usecase.OrderHistoryUseCase;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/orders")
public class OrderHistoryController {

    private final OrderHistoryUseCase orderHistoryUseCase;

    @GetMapping("/user/history")
    @PreAuthorize("hasAnyRole('CUSTOMER','ADMIN')")
    @Transactional(readOnly = true)
    public ResponseEntity<List<OrderHistoryResponse>> usersOrderHistory(
            @RequestHeader(value = "Authorization", required = false) String jwt
    ) throws Exception {
        return new ResponseEntity<>(orderHistoryUseCase.getUserOrderHistory(jwt), HttpStatus.ACCEPTED);
    }

    @GetMapping("/{orderId}")
    @PreAuthorize("hasAnyRole('CUSTOMER','ADMIN')")
    @Transactional(readOnly = true)
    public ResponseEntity<OrderHistoryResponse> getOrderById(
            @PathVariable Long orderId,
            @RequestHeader(value = "Authorization", required = false) String jwt
    ) throws Exception {
        return new ResponseEntity<>(orderHistoryUseCase.getOrderById(orderId, jwt), HttpStatus.ACCEPTED);
    }

    @GetMapping("/item/{orderItemId}")
    @PreAuthorize("hasAnyRole('CUSTOMER','ADMIN')")
    @Transactional(readOnly = true)
    public ResponseEntity<OrderHistoryItemResponse> getOrderItemById(
            @PathVariable Long orderItemId,
            @RequestHeader(value = "Authorization", required = false) String jwt
    ) throws Exception {
        return new ResponseEntity<>(orderHistoryUseCase.getOrderItemById(orderItemId, jwt), HttpStatus.ACCEPTED);
    }
}

