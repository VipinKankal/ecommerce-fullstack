package com.example.ecommerce.admin.controller;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/admin/dispatch")
@PreAuthorize("hasRole('ADMIN')")
public class AdminDispatchController {

    private static final Map<String, DispatchQueueRecord> DISPATCH_QUEUE_STORE = new ConcurrentHashMap<>();
    private static final Map<String, List<DeliveryHistoryRecord>> DELIVERY_HISTORY_STORE = new ConcurrentHashMap<>();

    @GetMapping("/queue")
    public ResponseEntity<List<DispatchQueueRecord>> getDispatchQueue() {
        return ResponseEntity.ok(
                DISPATCH_QUEUE_STORE.values().stream()
                        .sorted(Comparator.comparing(DispatchQueueRecord::getId, String.CASE_INSENSITIVE_ORDER))
                        .toList()
        );
    }

    @PostMapping("/assign")
    public ResponseEntity<Map<String, Object>> assignDispatch(@RequestBody AssignDispatchRequest request) {
        if (request == null || request.getShipmentIds() == null || request.getShipmentIds().isEmpty()) {
            return ResponseEntity.ok(Map.of("updated", 0));
        }

        int updated = 0;
        for (Object shipmentIdValue : request.getShipmentIds()) {
            String shipmentId = String.valueOf(shipmentIdValue);
            DispatchQueueRecord record = DISPATCH_QUEUE_STORE.computeIfAbsent(shipmentId, this::buildDefaultDispatchRecord);
            record.setCourierId(request.getCourierId());
            record.setCourierName(request.getCourierName());
            record.setShipmentStatus("HANDED_TO_COURIER");
            updated++;
            appendHistory(record.getOrderId(), "HANDED_TO_COURIER", "Assigned by admin");
        }

        return ResponseEntity.ok(Map.of("updated", updated));
    }

    @PostMapping("/shipments/{shipmentId}/reassign")
    public ResponseEntity<DispatchQueueRecord> reassignDispatch(
            @PathVariable String shipmentId,
            @RequestBody ReassignDispatchRequest request
    ) {
        DispatchQueueRecord record = DISPATCH_QUEUE_STORE.computeIfAbsent(shipmentId, this::buildDefaultDispatchRecord);
        record.setCourierId(request == null ? null : request.getCourierId());
        record.setCourierName(request == null ? null : request.getCourierName());
        appendHistory(record.getOrderId(), "REASSIGNED", "Courier reassigned");
        return ResponseEntity.ok(record);
    }

    @GetMapping("/orders/{orderId}/delivery-history")
    public ResponseEntity<List<DeliveryHistoryRecord>> getDeliveryHistory(@PathVariable String orderId) {
        List<DeliveryHistoryRecord> history = DELIVERY_HISTORY_STORE.computeIfAbsent(orderId, this::defaultHistory);
        return ResponseEntity.ok(history);
    }

    private DispatchQueueRecord buildDefaultDispatchRecord(String shipmentId) {
        DispatchQueueRecord record = new DispatchQueueRecord();
        record.setId(shipmentId);
        record.setOrderId(shipmentId);
        record.setCustomerName("Customer");
        record.setCustomerPhone("-");
        record.setAddress("Address unavailable");
        record.setCity("-");
        record.setZone("Unassigned");
        record.setPaymentType("ONLINE");
        record.setPaymentStatus("PENDING");
        record.setCodAmount(0);
        record.setDeliveryWindow(LocalDateTime.now().plusDays(2).toLocalDate().toString());
        record.setShipmentStatus("LABEL_CREATED");
        record.setSlaRisk("LOW");
        return record;
    }

    private void appendHistory(String orderId, String status, String note) {
        DELIVERY_HISTORY_STORE.compute(orderId, (key, existing) -> {
            List<DeliveryHistoryRecord> history = existing == null ? defaultHistory(orderId) : existing;
            DeliveryHistoryRecord entry = new DeliveryHistoryRecord();
            entry.setId(orderId + "-" + (history.size() + 1));
            entry.setStatus(status);
            entry.setNote(note);
            entry.setUpdatedBy("ADMIN");
            entry.setUpdatedAt(LocalDateTime.now().toString());
            history.add(entry);
            return history;
        });
    }

    private List<DeliveryHistoryRecord> defaultHistory(String orderId) {
        DeliveryHistoryRecord placed = new DeliveryHistoryRecord();
        placed.setId(orderId + "-1");
        placed.setStatus("PLACED");
        placed.setNote("Order placed");
        placed.setUpdatedBy("SYSTEM");
        placed.setUpdatedAt(LocalDateTime.now().minusDays(2).toString());

        DeliveryHistoryRecord packed = new DeliveryHistoryRecord();
        packed.setId(orderId + "-2");
        packed.setStatus("PACKED");
        packed.setNote("Packed by warehouse");
        packed.setUpdatedBy("ADMIN");
        packed.setUpdatedAt(LocalDateTime.now().minusDays(1).toString());

        return new java.util.ArrayList<>(List.of(placed, packed));
    }

    @Data
    @NoArgsConstructor
    public static class AssignDispatchRequest {
        private Long courierId;
        private String courierName;
        private List<Object> shipmentIds;
    }

    @Data
    @NoArgsConstructor
    public static class ReassignDispatchRequest {
        private Long courierId;
        private String courierName;
    }

    @Data
    @NoArgsConstructor
    public static class DispatchQueueRecord {
        private String id;
        private String orderId;
        private String customerName;
        private String customerPhone;
        private String address;
        private String city;
        private String zone;
        private String paymentType;
        private String paymentStatus;
        private Integer codAmount;
        private String deliveryWindow;
        private String shipmentStatus;
        private Long courierId;
        private String courierName;
        private String slaRisk;
    }

    @Data
    @NoArgsConstructor
    public static class DeliveryHistoryRecord {
        private String id;
        private String status;
        private String reason;
        private String note;
        private String proofUrl;
        private String updatedBy;
        private String updatedAt;
    }
}

