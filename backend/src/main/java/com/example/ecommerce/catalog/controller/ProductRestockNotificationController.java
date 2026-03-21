package com.example.ecommerce.catalog.controller;

import com.example.ecommerce.catalog.service.ProductService;
import com.example.ecommerce.inventory.service.RestockNotificationService;
import com.example.ecommerce.modal.Product;
import com.example.ecommerce.modal.User;
import com.example.ecommerce.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/products")
@PreAuthorize("hasAnyRole('CUSTOMER','ADMIN')")
public class ProductRestockNotificationController {

    private final ProductService productService;
    private final UserService userService;
    private final RestockNotificationService restockNotificationService;

    @GetMapping("/{productId}/notify-me/status")
    public ResponseEntity<Map<String, Object>> getNotifyStatus(
            @PathVariable Long productId,
            @RequestHeader("Authorization") String jwt
    ) throws Exception {
        User user = userService.findUserByJwtToken(jwt);
        Product product = productService.findActiveProductById(productId);
        return ResponseEntity.ok(restockNotificationService.getSubscriptionStatus(user, product));
    }

    @PostMapping("/{productId}/notify-me")
    public ResponseEntity<Map<String, Object>> subscribeForRestock(
            @PathVariable Long productId,
            @RequestHeader("Authorization") String jwt
    ) throws Exception {
        User user = userService.findUserByJwtToken(jwt);
        Product product = productService.findActiveProductById(productId);
        return ResponseEntity.ok(restockNotificationService.subscribe(user, product));
    }
}
