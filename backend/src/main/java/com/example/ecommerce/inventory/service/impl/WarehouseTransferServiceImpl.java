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
    public WarehouseTransferResponse createTransferRequest(Product product, Seller seller, int quantity, String sellerNote, String pickupMode) {
        WarehouseTransferRequest request = new WarehouseTransferRequest();
        request.setProduct(product);
        request.setSeller(seller);
        WarehouseTransferSupport.validateCreateRequest(request, quantity);

        request.setQuantity(quantity);
        request.setSellerNote(sellerNote);
        request.setPickupMode(WarehouseTransferSupport.normalizePickupMode(pickupMode));
        request.setStatus(WarehouseTransferStatus.TRANSFER_PENDING);
        request.setRequestedAt(LocalDateTime.now());
        return WarehouseTransferSupport.toResponse(warehouseTransferRequestRepository.save(request));
    }

    @Override
    @Transactional(readOnly = true)
    public List<WarehouseTransferResponse> getSellerTransfers(Long sellerId) {
        return warehouseTransferRequestRepository.findBySellerIdOrderByRequestedAtDesc(sellerId)
                .stream()
                .map(WarehouseTransferSupport::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<WarehouseTransferResponse> getAllTransfers() {
        return warehouseTransferRequestRepository.findAllByOrderByRequestedAtDesc()
                .stream()
                .map(WarehouseTransferSupport::toResponse)
                .toList();
    }

    @Override
    public WarehouseTransferResponse approveTransfer(Long transferId, String adminNote) {
        WarehouseTransferRequest request = getTransfer(transferId);
        WarehouseTransferSupport.requireStatus(request, WarehouseTransferStatus.TRANSFER_PENDING, "Only pending transfers can be approved");
        request.setStatus(WarehouseTransferStatus.TRANSFER_APPROVED);
        request.setAdminNote(adminNote);
        request.setApprovedAt(LocalDateTime.now());
        return WarehouseTransferSupport.toResponse(warehouseTransferRequestRepository.save(request));
    }

    @Override
    public WarehouseTransferResponse rejectTransfer(Long transferId, String rejectionReason) {
        WarehouseTransferRequest request = getTransfer(transferId);
        WarehouseTransferSupport.requireStatus(request, WarehouseTransferStatus.TRANSFER_PENDING, "Only pending transfers can be rejected");
        request.setStatus(WarehouseTransferStatus.TRANSFER_REJECTED);
        request.setRejectionReason(rejectionReason);
        request.setAdminNote(rejectionReason);
        return WarehouseTransferSupport.toResponse(warehouseTransferRequestRepository.save(request));
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
        WarehouseTransferSupport.requireStatus(request, WarehouseTransferStatus.TRANSFER_APPROVED, "Only approved transfers can be planned");
        if (!WarehouseTransferSupport.isWarehousePickup(request)) {
            throw new IllegalArgumentException("Pickup planning is required only for WAREHOUSE_PICKUP mode");
        }

        String normalizedTransportMode = WarehouseTransferSupport.normalizeTransportMode(transportMode);
        String normalizedAssignedCourierName = WarehouseTransferSupport.normalizeText(assignedCourierName, 255);
        String normalizedTransporterName = WarehouseTransferSupport.normalizeText(transporterName, 255);

        if ("INTERNAL_COURIER".equals(normalizedTransportMode) && normalizedAssignedCourierName == null) {
            throw new IllegalArgumentException("Assigned courier name is required for internal courier pickup");
        }
        if ("EXTERNAL_TRANSPORT".equals(normalizedTransportMode) && normalizedTransporterName == null) {
            throw new IllegalArgumentException("Transporter name is required for external transport pickup");
        }

        request.setEstimatedWeightKg(WarehouseTransferSupport.normalizeWeight(estimatedWeightKg));
        request.setPackageCount(WarehouseTransferSupport.normalizePackageCount(packageCount));
        request.setPackageType(WarehouseTransferSupport.normalizePackageType(packageType));
        request.setPickupReadyAt(WarehouseTransferSupport.parseDateTime(pickupReadyAt));
        request.setPickupAddressVerified(Boolean.TRUE.equals(pickupAddressVerified));
        request.setTransportMode(normalizedTransportMode);
        request.setAssignedCourierName(normalizedAssignedCourierName);
        request.setTransporterName(normalizedTransporterName);
        request.setInvoiceNumber(WarehouseTransferSupport.normalizeText(invoiceNumber, 255));
        request.setChallanNumber(WarehouseTransferSupport.normalizeText(challanNumber, 255));
        request.setAdminNote(WarehouseTransferSupport.normalizeText(adminNote, 1200));
        return WarehouseTransferSupport.toResponse(warehouseTransferRequestRepository.save(request));
    }

    @Override
    public WarehouseTransferResponse markPickedUp(Long transferId, String adminNote) {
        WarehouseTransferRequest request = getTransfer(transferId);
        WarehouseTransferSupport.requireStatus(request, WarehouseTransferStatus.TRANSFER_APPROVED, "Only approved transfers can be marked picked up");
        if (!WarehouseTransferSupport.isWarehousePickup(request)) {
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
        String normalizedNote = WarehouseTransferSupport.normalizeText(adminNote, 1200);
        if (normalizedNote != null) {
            request.setAdminNote(normalizedNote);
        }
        request.setPickedUpAt(LocalDateTime.now());
        return WarehouseTransferSupport.toResponse(warehouseTransferRequestRepository.save(request));
    }

    @Override
    public WarehouseTransferResponse receiveTransfer(Long transferId, String adminNote) {
        WarehouseTransferRequest request = getTransfer(transferId);
        if (WarehouseTransferSupport.isWarehousePickup(request)) {
            WarehouseTransferSupport.requireStatus(request, WarehouseTransferStatus.PICKED_UP, "Only picked up transfers can be received");
        } else if (request.getStatus() != WarehouseTransferStatus.TRANSFER_APPROVED && request.getStatus() != WarehouseTransferStatus.PICKED_UP) {
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
                adminNote == null || adminNote.isBlank() ? "Warehouse received seller transfer" : adminNote
        );

        request.setStatus(WarehouseTransferStatus.TRANSFER_COMPLETED);
        String normalizedNote = WarehouseTransferSupport.normalizeText(adminNote, 1200);
        if (normalizedNote != null) {
            request.setAdminNote(normalizedNote);
        }
        request.setReceivedAt(LocalDateTime.now());
        return WarehouseTransferSupport.toResponse(warehouseTransferRequestRepository.save(request));
    }

    @Override
    public WarehouseTransferResponse cancelTransfer(Long transferId, Long sellerId) {
        WarehouseTransferRequest request = getTransfer(transferId);
        if (request.getSeller() == null || request.getSeller().getId() == null || !request.getSeller().getId().equals(sellerId)) {
            throw new IllegalArgumentException("Unauthorized transfer access");
        }
        WarehouseTransferSupport.requireStatus(request, WarehouseTransferStatus.TRANSFER_PENDING, "Only pending transfers can be cancelled");
        request.setStatus(WarehouseTransferStatus.TRANSFER_CANCELLED);
        request.setCancelledAt(LocalDateTime.now());
        return WarehouseTransferSupport.toResponse(warehouseTransferRequestRepository.save(request));
    }

    private WarehouseTransferRequest getTransfer(Long transferId) {
        return warehouseTransferRequestRepository.findById(transferId)
                .orElseThrow(() -> new IllegalArgumentException("Transfer request not found"));
    }
}
