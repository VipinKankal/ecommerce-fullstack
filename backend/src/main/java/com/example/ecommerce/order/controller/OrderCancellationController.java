package com.example.ecommerce.order.controller;

import com.example.ecommerce.order.request.CancelOrderRequest;
import com.example.ecommerce.order.response.OrderHistoryResponse;
import com.example.ecommerce.order.usecase.OrderCancellationUseCase;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/orders")
public class OrderCancellationController {

    private final OrderCancellationUseCase orderCancellationUseCase;

    @GetMapping("/cancel-reasons")
    @PreAuthorize("hasAnyRole('CUSTOMER','ADMIN')")
    public ResponseEntity<List<String>> getCancelReasons() {
        return ResponseEntity.ok(orderCancellationUseCase.getCancelReasons());
    }

    @PutMapping("/{orderId}/cancel")
    @PreAuthorize("hasAnyRole('CUSTOMER','ADMIN')")
    @Transactional
    public ResponseEntity<OrderHistoryResponse> cancelOrder(
            @PathVariable Long orderId,
            @Valid @RequestBody CancelOrderRequest request,
            @RequestHeader(value = "Authorization", required = false) String jwt
    ) throws Exception {
        return new ResponseEntity<>(orderCancellationUseCase.cancelOrder(orderId, request, jwt), HttpStatus.ACCEPTED);
    }
}

