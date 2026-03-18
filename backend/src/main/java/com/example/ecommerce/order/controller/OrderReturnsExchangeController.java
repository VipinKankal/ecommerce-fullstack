package com.example.ecommerce.order.controller;

import com.example.ecommerce.modal.User;
import com.example.ecommerce.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/orders")
public class OrderReturnsExchangeController {

    private final UserService userService;

    @GetMapping("/returns")
    @PreAuthorize("hasAnyRole('CUSTOMER','ADMIN')")
    public ResponseEntity<List<Object>> getReturnRequests(
            @RequestHeader("Authorization") String jwt
    ) throws Exception {
        User user = userService.findUserByJwtToken(jwt);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(List.of());
    }

    @PostMapping("/returns/items/{orderItemId}")
    @PreAuthorize("hasAnyRole('CUSTOMER','ADMIN')")
    public ResponseEntity<Map<String, String>> createReturnRequest(
            @PathVariable Long orderItemId,
            @RequestHeader("Authorization") String jwt,
            @RequestBody(required = false) Map<String, Object> payload
    ) throws Exception {
        userService.findUserByJwtToken(jwt);
        return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED).body(Map.of(
                "message", "Return request backend is not implemented yet for order item " + orderItemId
        ));
    }

    @GetMapping("/exchanges")
    @PreAuthorize("hasAnyRole('CUSTOMER','ADMIN')")
    public ResponseEntity<List<Object>> getExchangeRequests(
            @RequestHeader("Authorization") String jwt
    ) throws Exception {
        User user = userService.findUserByJwtToken(jwt);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(List.of());
    }

    @PostMapping("/exchanges/items/{orderItemId}")
    @PreAuthorize("hasAnyRole('CUSTOMER','ADMIN')")
    public ResponseEntity<Map<String, String>> createExchangeRequest(
            @PathVariable Long orderItemId,
            @RequestHeader("Authorization") String jwt,
            @RequestBody(required = false) Map<String, Object> payload
    ) throws Exception {
        userService.findUserByJwtToken(jwt);
        return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED).body(Map.of(
                "message", "Exchange request backend is not implemented yet for order item " + orderItemId
        ));
    }

    @PatchMapping("/exchanges/{requestId}/difference-payment")
    @PreAuthorize("hasAnyRole('CUSTOMER','ADMIN')")
    public ResponseEntity<Map<String, String>> submitDifferencePayment(
            @PathVariable Long requestId,
            @RequestHeader("Authorization") String jwt,
            @RequestBody(required = false) Map<String, Object> payload
    ) throws Exception {
        userService.findUserByJwtToken(jwt);
        return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED).body(Map.of(
                "message", "Exchange difference payment flow is not implemented yet for request " + requestId
        ));
    }

    @PatchMapping("/exchanges/{requestId}/balance-mode")
    @PreAuthorize("hasAnyRole('CUSTOMER','ADMIN')")
    public ResponseEntity<Map<String, String>> selectBalanceMode(
            @PathVariable Long requestId,
            @RequestHeader("Authorization") String jwt,
            @RequestBody(required = false) Map<String, Object> payload
    ) throws Exception {
        userService.findUserByJwtToken(jwt);
        return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED).body(Map.of(
                "message", "Exchange balance mode flow is not implemented yet for request " + requestId
        ));
    }

    @PatchMapping("/exchanges/{requestId}/bank-details")
    @PreAuthorize("hasAnyRole('CUSTOMER','ADMIN')")
    public ResponseEntity<Map<String, String>> submitBankDetails(
            @PathVariable Long requestId,
            @RequestHeader("Authorization") String jwt,
            @RequestBody(required = false) Map<String, Object> payload
    ) throws Exception {
        userService.findUserByJwtToken(jwt);
        return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED).body(Map.of(
                "message", "Exchange bank details flow is not implemented yet for request " + requestId
        ));
    }
}
