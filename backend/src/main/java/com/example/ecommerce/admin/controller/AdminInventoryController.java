package com.example.ecommerce.admin.controller;

import com.example.ecommerce.admin.service.AdminInventoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminInventoryController {

    private final AdminInventoryService adminInventoryService;

    @GetMapping("/products/{productId}/movements")
    public ResponseEntity<List<Map<String, Object>>> getProductMovements(
            @PathVariable Long productId
    ) throws Exception {
        return ResponseEntity.ok(adminInventoryService.getProductMovements(productId));
    }

    @PatchMapping("/inventory/{productId}")
    public ResponseEntity<Map<String, Object>> adjustInventory(
            @PathVariable Long productId,
            @RequestBody(required = false) Map<String, Object> payload
    ) throws Exception {
        return ResponseEntity.ok(
                adminInventoryService.adjustInventory(productId, payload == null ? Map.of() : payload)
        );
    }

    @PostMapping("/notify-demand/{productId}/trigger")
    public ResponseEntity<Map<String, Object>> triggerRestockNotification(
            @PathVariable Long productId,
            @RequestBody(required = false) Map<String, Object> payload
    ) throws Exception {
        String note = payload == null || payload.get("note") == null
                ? null
                : String.valueOf(payload.get("note"));
        return ResponseEntity.ok(adminInventoryService.triggerRestockNotification(productId, note));
    }
}
