package com.example.ecommerce.inventory.service.impl;

import com.example.ecommerce.common.domain.WarehouseTransferStatus;
import com.example.ecommerce.inventory.response.WarehouseTransferResponse;
import com.example.ecommerce.modal.WarehouseTransferRequest;

import java.time.LocalDateTime;
import java.util.List;

final class WarehouseTransferSupport {

    private WarehouseTransferSupport() {
    }

    static void validateCreateRequest(WarehouseTransferRequest request, int quantity) {
        if (quantity <= 0) {
            throw new IllegalArgumentException("Transfer quantity must be greater than zero");
        }
        if (request.getProduct().getSeller() == null || request.getProduct().getSeller().getId() == null
                || !request.getProduct().getSeller().getId().equals(request.getSeller().getId())) {
            throw new IllegalArgumentException("Unauthorized product access");
        }
        if (request.getProduct().getSellerStock() < quantity) {
            throw new IllegalArgumentException(
                    "Insufficient seller stock for warehouse transfer. Available: "
                            + request.getProduct().getSellerStock()
                            + ", requested: "
                            + quantity
            );
        }
    }

    static void requireStatus(WarehouseTransferRequest request, WarehouseTransferStatus expected, String message) {
        if (request.getStatus() != expected) {
            throw new IllegalArgumentException(message);
        }
    }

    static String normalizePickupMode(String pickupMode) {
        if (pickupMode == null || pickupMode.isBlank()) {
            return "WAREHOUSE_PICKUP";
        }
        String normalized = pickupMode.trim().toUpperCase();
        if (!"SELLER_DROP".equals(normalized) && !"WAREHOUSE_PICKUP".equals(normalized)) {
            return "WAREHOUSE_PICKUP";
        }
        return normalized;
    }

    static boolean isWarehousePickup(WarehouseTransferRequest request) {
        return "WAREHOUSE_PICKUP".equals(normalizePickupMode(request.getPickupMode()));
    }

    static double normalizeWeight(Double estimatedWeightKg) {
        if (estimatedWeightKg == null || estimatedWeightKg <= 0) {
            throw new IllegalArgumentException("Estimated weight is required and must be greater than zero");
        }
        return Math.min(estimatedWeightKg, 10000);
    }

    static int normalizePackageCount(Integer packageCount) {
        if (packageCount == null || packageCount <= 0) {
            throw new IllegalArgumentException("Package count is required and must be greater than zero");
        }
        return Math.min(packageCount, 500);
    }

    static String normalizePackageType(String packageType) {
        if (packageType == null || packageType.isBlank()) {
            return null;
        }
        String normalized = packageType.trim().toUpperCase();
        if (normalized.length() > 64) {
            normalized = normalized.substring(0, 64);
        }
        return normalized;
    }

    static String normalizeTransportMode(String transportMode) {
        if (transportMode == null || transportMode.isBlank()) {
            return "INTERNAL_COURIER";
        }
        String normalized = transportMode.trim().toUpperCase();
        if (!List.of("INTERNAL_COURIER", "EXTERNAL_TRANSPORT").contains(normalized)) {
            return "INTERNAL_COURIER";
        }
        return normalized;
    }

    static String normalizeText(String value, int maxLength) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        if (trimmed.isBlank()) {
            return null;
        }
        if (trimmed.length() > maxLength) {
            return trimmed.substring(0, maxLength);
        }
        return trimmed;
    }

    static LocalDateTime parseDateTime(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("Pickup ready date and time is required");
        }
        try {
            return LocalDateTime.parse(value.trim().replace("Z", ""));
        } catch (Exception ex) {
            throw new IllegalArgumentException("Invalid pickup ready date format");
        }
    }

    static WarehouseTransferResponse toResponse(WarehouseTransferRequest request) {
        WarehouseTransferResponse response = new WarehouseTransferResponse();
        response.setId(request.getId());
        response.setQuantity(request.getQuantity());
        response.setStatus(request.getStatus() == null ? null : request.getStatus().name());
        response.setSellerNote(request.getSellerNote());
        response.setAdminNote(request.getAdminNote());
        response.setRejectionReason(request.getRejectionReason());
        response.setPickupMode(request.getPickupMode());
        response.setEstimatedWeightKg(request.getEstimatedWeightKg());
        response.setPackageCount(request.getPackageCount());
        response.setPreferredVehicle(request.getPreferredVehicle());
        response.setSuggestedVehicle(request.getSuggestedVehicle());
        response.setEstimatedPickupHours(request.getEstimatedPickupHours());
        response.setEstimatedLogisticsCharge(request.getEstimatedLogisticsCharge());
        response.setPackageType(request.getPackageType());
        response.setPickupReadyAt(request.getPickupReadyAt());
        response.setPickupAddressVerified(request.getPickupAddressVerified());
        response.setTransportMode(request.getTransportMode());
        response.setAssignedCourierName(request.getAssignedCourierName());
        response.setTransporterName(request.getTransporterName());
        response.setInvoiceNumber(request.getInvoiceNumber());
        response.setChallanNumber(request.getChallanNumber());
        response.setRequestedAt(request.getRequestedAt());
        response.setApprovedAt(request.getApprovedAt());
        response.setPickedUpAt(request.getPickedUpAt());
        response.setReceivedAt(request.getReceivedAt());
        response.setCancelledAt(request.getCancelledAt());
        if (request.getProduct() != null) {
            response.setProductId(request.getProduct().getId());
            response.setProductTitle(request.getProduct().getTitle());
            response.setCategoryName(request.getProduct().getCategory() == null ? null : request.getProduct().getCategory().getName());
            response.setSellerStock(request.getProduct().getSellerStock());
            response.setWarehouseStock(request.getProduct().getWarehouseStock());
        }
        if (request.getSeller() != null) {
            response.setSellerId(request.getSeller().getId());
            response.setSellerName(request.getSeller().getSellerName());
        }
        return response;
    }
}
