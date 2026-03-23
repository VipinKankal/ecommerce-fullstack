package com.example.ecommerce.order.controller;

import com.example.ecommerce.modal.User;
import com.example.ecommerce.order.service.OrderAftercareService;
import com.example.ecommerce.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.InsufficientAuthenticationException;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/orders")
public class OrderReturnsExchangeController {

    private final UserService userService;
    private final OrderAftercareService orderAftercareService;

    @GetMapping("/returns")
    @PreAuthorize("hasAnyRole('CUSTOMER','ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> getReturnRequests(
            @RequestHeader(value = "Authorization", required = false) String jwt
    ) throws Exception {
        User user = userService.findUserByJwtToken(jwt);
        if (user == null) {
            throw new InsufficientAuthenticationException("Authentication required");
        }
        return ResponseEntity.ok(orderAftercareService.getCustomerReturnRequests(user.getId()));
    }

    @GetMapping("/return-exchange")
    @PreAuthorize("hasAnyRole('CUSTOMER','ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> getReturnExchangeRequests(
            @RequestHeader(value = "Authorization", required = false) String jwt
    ) throws Exception {
        User user = userService.findUserByJwtToken(jwt);
        if (user == null) {
            throw new InsufficientAuthenticationException("Authentication required");
        }
        return ResponseEntity.ok(orderAftercareService.getCustomerReturnExchangeRequests(user.getId()));
    }

    @PostMapping("/returns/items/{orderItemId}")
    @PreAuthorize("hasAnyRole('CUSTOMER','ADMIN')")
    public ResponseEntity<Map<String, Object>> createReturnRequest(
            @PathVariable Long orderItemId,
            @RequestHeader(value = "Authorization", required = false) String jwt,
            @RequestBody(required = false) Map<String, Object> payload
    ) throws Exception {
        User user = userService.findUserByJwtToken(jwt);
        return ResponseEntity.ok(orderAftercareService.createReturnRequest(user, orderItemId, payload));
    }

    @PostMapping("/return-exchange/items/{orderItemId}")
    @PreAuthorize("hasAnyRole('CUSTOMER','ADMIN')")
    public ResponseEntity<Map<String, Object>> createReturnExchangeRequest(
            @PathVariable Long orderItemId,
            @RequestHeader(value = "Authorization", required = false) String jwt,
            @RequestBody(required = false) Map<String, Object> payload
    ) throws Exception {
        User user = userService.findUserByJwtToken(jwt);
        return ResponseEntity.ok(orderAftercareService.createReturnExchangeRequest(user, orderItemId, payload));
    }

    @GetMapping("/exchanges")
    @PreAuthorize("hasAnyRole('CUSTOMER','ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> getExchangeRequests(
            @RequestHeader(value = "Authorization", required = false) String jwt
    ) throws Exception {
        User user = userService.findUserByJwtToken(jwt);
        if (user == null) {
            throw new InsufficientAuthenticationException("Authentication required");
        }
        return ResponseEntity.ok(orderAftercareService.getCustomerExchangeRequests(user.getId()));
    }

    @PostMapping("/exchanges/items/{orderItemId}")
    @PreAuthorize("hasAnyRole('CUSTOMER','ADMIN')")
    public ResponseEntity<Map<String, Object>> createExchangeRequest(
            @PathVariable Long orderItemId,
            @RequestHeader(value = "Authorization", required = false) String jwt,
            @RequestBody(required = false) Map<String, Object> payload
    ) throws Exception {
        User user = userService.findUserByJwtToken(jwt);
        return ResponseEntity.ok(orderAftercareService.createExchangeRequest(user, orderItemId, payload));
    }

    @PatchMapping("/exchanges/{requestId}/difference-payment")
    @PreAuthorize("hasAnyRole('CUSTOMER','ADMIN')")
    public ResponseEntity<Map<String, Object>> submitDifferencePayment(
            @PathVariable Long requestId,
            @RequestHeader(value = "Authorization", required = false) String jwt,
            @RequestBody(required = false) Map<String, Object> payload
    ) throws Exception {
        User user = userService.findUserByJwtToken(jwt);
        String paymentReference = payload == null || payload.get("paymentReference") == null
                ? null
                : String.valueOf(payload.get("paymentReference"));
        return ResponseEntity.ok(orderAftercareService.submitDifferencePayment(user, requestId, paymentReference));
    }

    @PatchMapping("/exchanges/{requestId}/balance-mode")
    @PreAuthorize("hasAnyRole('CUSTOMER','ADMIN')")
    public ResponseEntity<Map<String, Object>> selectBalanceMode(
            @PathVariable Long requestId,
            @RequestHeader(value = "Authorization", required = false) String jwt,
            @RequestBody(required = false) Map<String, Object> payload
    ) throws Exception {
        User user = userService.findUserByJwtToken(jwt);
        String balanceMode = payload == null || payload.get("balanceMode") == null
                ? null
                : String.valueOf(payload.get("balanceMode"));
        return ResponseEntity.ok(orderAftercareService.selectBalanceMode(user, requestId, balanceMode));
    }

    @PatchMapping("/exchanges/{requestId}/bank-details")
    @PreAuthorize("hasAnyRole('CUSTOMER','ADMIN')")
    public ResponseEntity<Map<String, Object>> submitBankDetails(
            @PathVariable Long requestId,
            @RequestHeader(value = "Authorization", required = false) String jwt,
            @RequestBody(required = false) Map<String, Object> payload
    ) throws Exception {
        User user = userService.findUserByJwtToken(jwt);
        return ResponseEntity.ok(orderAftercareService.submitBankDetails(user, requestId, payload));
    }
}

