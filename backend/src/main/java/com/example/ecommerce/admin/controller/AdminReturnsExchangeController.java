package com.example.ecommerce.admin.controller;

import com.example.ecommerce.order.service.OrderAftercareService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminReturnsExchangeController {

    private final OrderAftercareService orderAftercareService;

    @GetMapping("/returns")
    public ResponseEntity<List<Map<String, Object>>> getReturnRequests() {
        return ResponseEntity.ok(orderAftercareService.getAdminReturnRequests());
    }

    @PatchMapping("/returns/{requestId}/review")
    public ResponseEntity<Map<String, Object>> reviewReturnRequest(
            @PathVariable Long requestId,
            @RequestBody(required = false) Map<String, Object> payload
    ) throws Exception {
        return ResponseEntity.ok(orderAftercareService.reviewReturnRequest(requestId, payload == null ? Map.of() : payload));
    }

    @PatchMapping("/returns/{requestId}/refund/initiate")
    public ResponseEntity<Map<String, Object>> initiateRefund(
            @PathVariable Long requestId,
            @RequestBody(required = false) Map<String, Object> payload
    ) throws Exception {
        String adminComment = payload == null || payload.get("adminComment") == null
                ? null
                : String.valueOf(payload.get("adminComment"));
        return ResponseEntity.ok(orderAftercareService.initiateRefund(requestId, adminComment));
    }

    @PatchMapping("/returns/{requestId}/pickup")
    public ResponseEntity<Map<String, Object>> markReturnPickup(
            @PathVariable Long requestId,
            @RequestBody(required = false) Map<String, Object> payload
    ) throws Exception {
        String adminComment = payload == null || payload.get("adminComment") == null
                ? null
                : String.valueOf(payload.get("adminComment"));
        return ResponseEntity.ok(orderAftercareService.markReturnPickup(requestId, adminComment));
    }

    @PatchMapping("/returns/{requestId}/receive")
    public ResponseEntity<Map<String, Object>> receiveReturn(
            @PathVariable Long requestId,
            @RequestBody(required = false) Map<String, Object> payload
    ) throws Exception {
        return ResponseEntity.ok(orderAftercareService.receiveReturn(requestId, payload == null ? Map.of() : payload));
    }

    @PatchMapping("/returns/{requestId}/refund/complete")
    public ResponseEntity<Map<String, Object>> completeRefund(
            @PathVariable Long requestId,
            @RequestBody(required = false) Map<String, Object> payload
    ) throws Exception {
        String adminComment = payload == null || payload.get("adminComment") == null
                ? null
                : String.valueOf(payload.get("adminComment"));
        return ResponseEntity.ok(orderAftercareService.completeRefund(requestId, adminComment));
    }

    @GetMapping("/exchanges")
    public ResponseEntity<List<Map<String, Object>>> getExchangeRequests() {
        return ResponseEntity.ok(orderAftercareService.getAdminExchangeRequests());
    }

    @PatchMapping("/exchanges/{requestId}/approve")
    public ResponseEntity<Map<String, Object>> approveExchange(
            @PathVariable Long requestId,
            @RequestBody(required = false) Map<String, Object> payload
    ) throws Exception {
        return ResponseEntity.ok(orderAftercareService.approveExchange(requestId, payload == null ? Map.of() : payload));
    }

    @PatchMapping("/exchanges/{requestId}/reject")
    public ResponseEntity<Map<String, Object>> rejectExchange(
            @PathVariable Long requestId,
            @RequestBody(required = false) Map<String, Object> payload
    ) throws Exception {
        String note = null;
        if (payload != null) {
            Object rejectionReason = payload.get("rejectionReason");
            Object adminComment = payload.get("adminComment");
            note = rejectionReason != null ? String.valueOf(rejectionReason) : adminComment == null ? null : String.valueOf(adminComment);
        }
        return ResponseEntity.ok(orderAftercareService.rejectExchange(requestId, note));
    }

    @PatchMapping("/exchanges/{requestId}/pickup")
    public ResponseEntity<Map<String, Object>> markExchangePickup(
            @PathVariable Long requestId,
            @RequestBody(required = false) Map<String, Object> payload
    ) throws Exception {
        String adminComment = payload == null || payload.get("adminComment") == null
                ? null
                : String.valueOf(payload.get("adminComment"));
        return ResponseEntity.ok(orderAftercareService.markExchangePickup(requestId, adminComment));
    }

    @PatchMapping("/exchanges/{requestId}/receive")
    public ResponseEntity<Map<String, Object>> receiveExchange(
            @PathVariable Long requestId,
            @RequestBody(required = false) Map<String, Object> payload
    ) throws Exception {
        return ResponseEntity.ok(orderAftercareService.receiveExchange(requestId, payload == null ? Map.of() : payload));
    }

    @PatchMapping("/exchanges/{requestId}/replacement-order")
    public ResponseEntity<Map<String, Object>> createReplacementOrder(
            @PathVariable Long requestId,
            @RequestBody(required = false) Map<String, Object> payload
    ) throws Exception {
        return ResponseEntity.ok(orderAftercareService.createReplacementOrder(requestId, payload == null ? Map.of() : payload));
    }

    @PatchMapping("/exchanges/{requestId}/replacement-delivered")
    public ResponseEntity<Map<String, Object>> completeReplacementDelivery(
            @PathVariable Long requestId,
            @RequestBody(required = false) Map<String, Object> payload
    ) throws Exception {
        String adminComment = payload == null || payload.get("adminComment") == null
                ? null
                : String.valueOf(payload.get("adminComment"));
        return ResponseEntity.ok(orderAftercareService.completeReplacementDelivery(requestId, adminComment));
    }
}
