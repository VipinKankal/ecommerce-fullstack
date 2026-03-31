package com.example.ecommerce.order.controller;

import com.example.ecommerce.modal.Address;
import com.example.ecommerce.order.request.CheckoutOrderRequest;
import com.example.ecommerce.order.request.CheckoutOrderSummaryRequest;
import com.example.ecommerce.order.response.CheckoutOrderSummaryResponse;
import com.example.ecommerce.order.response.PaymentLinkResponse;
import com.example.ecommerce.order.usecase.OrderCheckoutUseCase;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/orders")
public class OrderCheckoutController {

    private final OrderCheckoutUseCase orderCheckoutUseCase;

    @PostMapping
    @PreAuthorize("hasAnyRole('CUSTOMER','ADMIN')")
    public ResponseEntity<PaymentLinkResponse> createPaymentLink(
            @RequestBody Address shippingAddress,
            @RequestParam String paymentMethod,
            @RequestHeader(value = "Authorization", required = false) String jwt
    ) throws Exception {
        return ResponseEntity.ok(orderCheckoutUseCase.createPaymentLink(shippingAddress, paymentMethod, jwt));
    }

    @PostMapping("/create")
    @PreAuthorize("hasAnyRole('CUSTOMER','ADMIN')")
    public ResponseEntity<PaymentLinkResponse> createCheckoutOrder(
            @Valid @RequestBody CheckoutOrderRequest request,
            @RequestHeader(value = "Authorization", required = false) String jwt
    ) throws Exception {
        return ResponseEntity.ok(orderCheckoutUseCase.createCheckoutOrder(request, jwt));
    }

    @PostMapping("/summary")
    @PreAuthorize("hasAnyRole('CUSTOMER','ADMIN')")
    public ResponseEntity<CheckoutOrderSummaryResponse> getCheckoutSummary(
            @Valid @RequestBody CheckoutOrderSummaryRequest request,
            @RequestHeader(value = "Authorization", required = false) String jwt
    ) throws Exception {
        return ResponseEntity.ok(orderCheckoutUseCase.getCheckoutSummary(request, jwt));
    }
}

