package com.example.ecommerce.inventory.service.impl;

import com.example.ecommerce.common.domain.WarehouseTransferStatus;
import com.example.ecommerce.inventory.response.WarehouseTransferResponse;
import com.example.ecommerce.inventory.service.InventoryService;
import com.example.ecommerce.inventory.service.WarehouseTransferService;
import com.example.ecommerce.modal.Product;
import com.example.ecommerce.modal.Seller;
import com.example.ecommerce.modal.WarehouseTransferRequest;
import com.example.ecommerce.repository.WarehouseTransferRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class WarehouseTransferServiceImpl implements WarehouseTransferService {

    private final WarehouseTransferRequestRepository warehouseTransferRequestRepository;
    private final InventoryService inventoryService;

    @Override
    public WarehouseTransferResponse createTransferRequest(
            Product product,
            Seller seller,
            int quantity,
            String sellerNote,
            String pickupMode
    ) {
        if (quantity <= 0) {
            throw new IllegalArgumentException("Transfer quantity must be greater than zero");
        }
        if (product.getSeller() == null || product.getSeller().getId() == null
                || !product.getSeller().getId().equals(seller.getId())) {
            throw new IllegalArgumentException("Unauthorized product access");
        }
        if (product.getSellerStock() < quantity) {
            throw new IllegalArgumentException(
                    "Insufficient seller stock for warehouse transfer. Available: "
                            + product.getSellerStock()
                            + ", requested: "
                            + quantity
            );
        }

        String normalizedPickupMode = normalizePickupMode(pickupMode);

        WarehouseTransferRequest request = new WarehouseTransferRequest();
        request.setProduct(product);
        request.setSeller(seller);
        request.setQuantity(quantity);
        request.setSellerNote(sellerNote);
        request.setPickupMode(normalizedPickupMode);
        request.setStatus(WarehouseTransferStatus.TRANSFER_PENDING);
        request.setRequestedAt(LocalDateTime.now());
        return toResponse(warehouseTransferRequestRepository.save(request));
    }

    @Override
    @Transactional(readOnly = true)
    public List<WarehouseTransferResponse> getSellerTransfers(Long sellerId) {
        return warehouseTransferRequestRepository.findBySellerIdOrderByRequestedAtDesc(sellerId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<WarehouseTransferResponse> getAllTransfers() {
        return warehouseTransferRequestRepository.findAllByOrderByRequestedAtDesc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public WarehouseTransferResponse approveTransfer(Long transferId, String adminNote) {
        WarehouseTransferRequest request = getTransfer(transferId);
        requireStatus(request, WarehouseTransferStatus.TRANSFER_PENDING, "Only pending transfers can be approved");
        request.setStatus(WarehouseTransferStatus.TRANSFER_APPROVED);
        request.setAdminNote(adminNote);
        request.setApprovedAt(LocalDateTime.now());
        return toResponse(warehouseTransferRequestRepository.save(request));
    }

    @Override
    public WarehouseTransferResponse rejectTransfer(Long transferId, String rejectionReason) {
        WarehouseTransferRequest request = getTransfer(transferId);
        requireStatus(request, WarehouseTransferStatus.TRANSFER_PENDING, "Only pending transfers can be rejected");
        request.setStatus(WarehouseTransferStatus.TRANSFER_REJECTED);
        request.setRejectionReason(rejectionReason);
        request.setAdminNote(rejectionReason);
        return toResponse(warehouseTransferRequestRepository.save(request));
    }

    @Override
    public WarehouseTransferResponse planPickup(
            Long transferId,
            Double estimatedWeightKg,
            Integer packageCount,
            String packageType,
            String pickupReadyAt,
            Boolean pickupAddressVerified,
            String transportMode,
            String assignedCourierName,
            String transporterName,
            String invoiceNumber,
            String challanNumber,
            String adminNote
    ) {
        WarehouseTransferRequest request = getTransfer(transferId);
        requireStatus(request, WarehouseTransferStatus.TRANSFER_APPROVED, "Only approved transfers can be planned");
        if (!isWarehousePickup(request)) {
            throw new IllegalArgumentException("Pickup planning is required only for WAREHOUSE_PICKUP mode");
        }

        String normalizedTransportMode = normalizeTransportMode(transportMode);
        String normalizedAssignedCourierName = normalizeText(assignedCourierName, 255);
        String normalizedTransporterName = normalizeText(transporterName, 255);

        if ("INTERNAL_COURIER".equals(normalizedTransportMode) && normalizedAssignedCourierName == null) {
            throw new IllegalArgumentException("Assigned courier name is required for internal courier pickup");
        }
        if ("EXTERNAL_TRANSPORT".equals(normalizedTransportMode) && normalizedTransporterName == null) {
            throw new IllegalArgumentException("Transporter name is required for external transport pickup");
        }

        request.setEstimatedWeightKg(normalizeWeight(estimatedWeightKg));
        request.setPackageCount(normalizePackageCount(packageCount));
        request.setPackageType(normalizePackageType(packageType));
        request.setPickupReadyAt(parseDateTime(pickupReadyAt));
        request.setPickupAddressVerified(Boolean.TRUE.equals(pickupAddressVerified));
        request.setTransportMode(normalizedTransportMode);
        request.setAssignedCourierName(normalizedAssignedCourierName);
        request.setTransporterName(normalizedTransporterName);
        request.setInvoiceNumber(normalizeText(invoiceNumber, 255));
        request.setChallanNumber(normalizeText(challanNumber, 255));
        request.setAdminNote(normalizeText(adminNote, 1200));
        return toResponse(warehouseTransferRequestRepository.save(request));
    }

    @Override
    public WarehouseTransferResponse markPickedUp(Long transferId, String adminNote) {
        WarehouseTransferRequest request = getTransfer(transferId);
        requireStatus(request, WarehouseTransferStatus.TRANSFER_APPROVED, "Only approved transfers can be marked picked up");
        if (!isWarehousePickup(request)) {
            throw new IllegalArgumentException("SELLER_DROP transfer should be received directly after drop");
        }
        if (request.getTransportMode() == null || request.getTransportMode().isBlank()) {
            throw new IllegalArgumentException("Plan pickup details before marking as picked up");
        }
        if ("INTERNAL_COURIER".equals(request.getTransportMode())
                && (request.getAssignedCourierName() == null || request.getAssignedCourierName().isBlank())) {
            throw new IllegalArgumentException("Assigned courier name is missing");
        }
        if ("EXTERNAL_TRANSPORT".equals(request.getTransportMode())
                && (request.getTransporterName() == null || request.getTransporterName().isBlank())) {
            throw new IllegalArgumentException("Transporter name is missing");
        }
        request.setStatus(WarehouseTransferStatus.PICKED_UP);
        String normalizedNote = normalizeText(adminNote, 1200);
        if (normalizedNote != null) {
            request.setAdminNote(normalizedNote);
        }
        request.setPickedUpAt(LocalDateTime.now());
        return toResponse(warehouseTransferRequestRepository.save(request));
    }

    @Override
    public WarehouseTransferResponse receiveTransfer(Long transferId, String adminNote) {
        WarehouseTransferRequest request = getTransfer(transferId);
        if (isWarehousePickup(request)) {
            requireStatus(request, WarehouseTransferStatus.PICKED_UP, "Only picked up transfers can be received");
        } else if (request.getStatus() != WarehouseTransferStatus.TRANSFER_APPROVED
                && request.getStatus() != WarehouseTransferStatus.PICKED_UP) {
            throw new IllegalArgumentException("SELLER_DROP transfer can be received only after approval");
        }
        Product product = request.getProduct();
        int quantity = request.getQuantity() == null ? 0 : request.getQuantity();
        if (product.getSellerStock() < quantity) {
            throw new IllegalArgumentException("Seller stock changed and is no longer sufficient for this transfer");
        }

        inventoryService.receiveSellerStockAtWarehouse(
                product,
                quantity,
                request.getId(),
                adminNote == null || adminNote.isBlank()
                        ? "Warehouse received seller transfer"
                        : adminNote
        );

        request.setStatus(WarehouseTransferStatus.TRANSFER_COMPLETED);
        String normalizedNote = normalizeText(adminNote, 1200);
        if (normalizedNote != null) {
            request.setAdminNote(normalizedNote);
        }
        request.setReceivedAt(LocalDateTime.now());
        return toResponse(warehouseTransferRequestRepository.save(request));
    }

    @Override
    public WarehouseTransferResponse cancelTransfer(Long transferId, Long sellerId) {
        WarehouseTransferRequest request = getTransfer(transferId);
        if (request.getSeller() == null || request.getSeller().getId() == null
                || !request.getSeller().getId().equals(sellerId)) {
            throw new IllegalArgumentException("Unauthorized transfer access");
        }
        requireStatus(request, WarehouseTransferStatus.TRANSFER_PENDING, "Only pending transfers can be cancelled");
        request.setStatus(WarehouseTransferStatus.TRANSFER_CANCELLED);
        request.setCancelledAt(LocalDateTime.now());
        return toResponse(warehouseTransferRequestRepository.save(request));
    }

    private WarehouseTransferRequest getTransfer(Long transferId) {
        return warehouseTransferRequestRepository.findById(transferId)
                .orElseThrow(() -> new IllegalArgumentException("Transfer request not found"));
    }

    private void requireStatus(
            WarehouseTransferRequest request,
            WarehouseTransferStatus expected,
            String message
    ) {
        if (request.getStatus() != expected) {
            throw new IllegalArgumentException(message);
        }
    }

    private WarehouseTransferResponse toResponse(WarehouseTransferRequest request) {
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
            response.setCategoryName(
                    request.getProduct().getCategory() == null
                            ? null
                            : request.getProduct().getCategory().getName()
            );
            response.setSellerStock(request.getProduct().getSellerStock());
            response.setWarehouseStock(request.getProduct().getWarehouseStock());
        }
        if (request.getSeller() != null) {
            response.setSellerId(request.getSeller().getId());
            response.setSellerName(request.getSeller().getSellerName());
        }
        return response;
    }

    private String normalizePickupMode(String pickupMode) {
        if (pickupMode == null || pickupMode.isBlank()) {
            return "WAREHOUSE_PICKUP";
        }
        String normalized = pickupMode.trim().toUpperCase();
        if (!"SELLER_DROP".equals(normalized) && !"WAREHOUSE_PICKUP".equals(normalized)) {
            return "WAREHOUSE_PICKUP";
        }
        return normalized;
    }

    private boolean isWarehousePickup(WarehouseTransferRequest request) {
        return "WAREHOUSE_PICKUP".equals(normalizePickupMode(request.getPickupMode()));
    }

    private double normalizeWeight(Double estimatedWeightKg) {
        if (estimatedWeightKg == null || estimatedWeightKg <= 0) {
            throw new IllegalArgumentException("Estimated weight is required and must be greater than zero");
        }
        return Math.min(estimatedWeightKg, 10000);
    }

    private int normalizePackageCount(Integer packageCount) {
        if (packageCount == null || packageCount <= 0) {
            throw new IllegalArgumentException("Package count is required and must be greater than zero");
        }
        return Math.min(packageCount, 500);
    }

    private String normalizePackageType(String packageType) {
        if (packageType == null || packageType.isBlank()) {
            return null;
        }
        String normalized = packageType.trim().toUpperCase();
        if (normalized.length() > 64) {
            normalized = normalized.substring(0, 64);
        }
        return normalized;
    }

    private String normalizeTransportMode(String transportMode) {
        if (transportMode == null || transportMode.isBlank()) {
            return "INTERNAL_COURIER";
        }
        String normalized = transportMode.trim().toUpperCase();
        if (!List.of("INTERNAL_COURIER", "EXTERNAL_TRANSPORT").contains(normalized)) {
            return "INTERNAL_COURIER";
        }
        return normalized;
    }

    private String normalizeText(String value, int maxLength) {
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

    private LocalDateTime parseDateTime(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("Pickup ready date and time is required");
        }
        try {
            return LocalDateTime.parse(value.trim().replace("Z", ""));
        } catch (Exception ex) {
            throw new IllegalArgumentException("Invalid pickup ready date format");
        }
    }
}
