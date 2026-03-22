package com.example.ecommerce.inventory.response;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class WarehouseTransferResponse {
    private Long id;
    private Long productId;
    private String productTitle;
    private String categoryName;
    private Long sellerId;
    private String sellerName;
    private Integer quantity;
    private String status;
    private String sellerNote;
    private String adminNote;
    private String rejectionReason;
    private String pickupProofUrl;
    private String receiveProofUrl;
    private String pickupMode;
    private Double estimatedWeightKg;
    private Integer packageCount;
    private String preferredVehicle;
    private String suggestedVehicle;
    private Integer estimatedPickupHours;
    private Integer estimatedLogisticsCharge;
    private String packageType;
    private LocalDateTime pickupReadyAt;
    private Boolean pickupAddressVerified;
    private String transportMode;
    private String assignedCourierName;
    private String transporterName;
    private String invoiceNumber;
    private String challanNumber;
    private Integer sellerStock;
    private Integer warehouseStock;
    private LocalDateTime requestedAt;
    private LocalDateTime approvedAt;
    private LocalDateTime pickedUpAt;
    private LocalDateTime receivedAt;
    private LocalDateTime cancelledAt;
}
