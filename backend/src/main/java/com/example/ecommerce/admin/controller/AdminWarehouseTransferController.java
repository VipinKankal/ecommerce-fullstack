package com.example.ecommerce.admin.controller;

import com.example.ecommerce.inventory.response.WarehouseTransferResponse;
import com.example.ecommerce.inventory.service.WarehouseTransferService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin/transfers")
@PreAuthorize("hasRole('ADMIN')")
public class AdminWarehouseTransferController {

    private final WarehouseTransferService warehouseTransferService;

    @GetMapping
    public ResponseEntity<List<WarehouseTransferResponse>> getTransfers() {
        return ResponseEntity.ok(warehouseTransferService.getAllTransfers());
    }

    @PostMapping("/{transferId}/approve")
    public ResponseEntity<WarehouseTransferResponse> approveTransfer(
            @PathVariable Long transferId,
            @RequestBody(required = false) Map<String, Object> payload
    ) {
        return ResponseEntity.ok(
                warehouseTransferService.approveTransfer(transferId, readText(payload, "note"))
        );
    }

    @PostMapping("/{transferId}/reject")
    public ResponseEntity<WarehouseTransferResponse> rejectTransfer(
            @PathVariable Long transferId,
            @RequestBody(required = false) Map<String, Object> payload
    ) {
        return ResponseEntity.ok(
                warehouseTransferService.rejectTransfer(transferId, readText(payload, "reason"))
        );
    }

    @PostMapping("/{transferId}/pickup")
    public ResponseEntity<WarehouseTransferResponse> markPickedUp(
            @PathVariable Long transferId,
            @RequestBody(required = false) Map<String, Object> payload
    ) {
        return ResponseEntity.ok(
                warehouseTransferService.markPickedUp(transferId, readText(payload, "note"))
        );
    }

    @PostMapping("/{transferId}/plan")
    public ResponseEntity<WarehouseTransferResponse> planPickup(
            @PathVariable Long transferId,
            @RequestBody(required = false) Map<String, Object> payload
    ) {
        return ResponseEntity.ok(
                warehouseTransferService.planPickup(
                        transferId,
                        readDouble(payload, "estimatedWeightKg"),
                        readInteger(payload, "packageCount"),
                        readText(payload, "packageType"),
                        readText(payload, "pickupReadyAt"),
                        readBoolean(payload, "pickupAddressVerified"),
                        readText(payload, "transportMode"),
                        readText(payload, "assignedCourierName"),
                        readText(payload, "transporterName"),
                        readText(payload, "invoiceNumber"),
                        readText(payload, "challanNumber"),
                        readText(payload, "note")
                )
        );
    }

    @PostMapping("/{transferId}/receive")
    public ResponseEntity<WarehouseTransferResponse> receiveTransfer(
            @PathVariable Long transferId,
            @RequestBody(required = false) Map<String, Object> payload
    ) {
        return ResponseEntity.ok(
                warehouseTransferService.receiveTransfer(transferId, readText(payload, "note"))
        );
    }

    private String readText(Map<String, Object> payload, String key) {
        if (payload == null || payload.get(key) == null) {
            return null;
        }
        String value = String.valueOf(payload.get(key)).trim();
        return value.isBlank() ? null : value;
    }

    private Integer readInteger(Map<String, Object> payload, String key) {
        if (payload == null || payload.get(key) == null) {
            return null;
        }
        Object raw = payload.get(key);
        if (raw instanceof Number number) {
            return number.intValue();
        }
        String value = String.valueOf(raw).trim();
        if (value.isBlank()) {
            return null;
        }
        return Integer.parseInt(value);
    }

    private Double readDouble(Map<String, Object> payload, String key) {
        if (payload == null || payload.get(key) == null) {
            return null;
        }
        Object raw = payload.get(key);
        if (raw instanceof Number number) {
            return number.doubleValue();
        }
        String value = String.valueOf(raw).trim();
        if (value.isBlank()) {
            return null;
        }
        return Double.parseDouble(value);
    }

    private Boolean readBoolean(Map<String, Object> payload, String key) {
        if (payload == null || payload.get(key) == null) {
            return null;
        }
        Object raw = payload.get(key);
        if (raw instanceof Boolean bool) {
            return bool;
        }
        String value = String.valueOf(raw).trim();
        if (value.isBlank()) {
            return null;
        }
        return "true".equalsIgnoreCase(value)
                || "1".equals(value)
                || "yes".equalsIgnoreCase(value)
                || "y".equalsIgnoreCase(value);
    }
}
