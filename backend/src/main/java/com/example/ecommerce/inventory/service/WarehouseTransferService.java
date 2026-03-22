package com.example.ecommerce.inventory.service;

import com.example.ecommerce.inventory.response.WarehouseTransferResponse;
import com.example.ecommerce.modal.Product;
import com.example.ecommerce.modal.Seller;

import java.util.List;

public interface WarehouseTransferService {
    WarehouseTransferResponse createTransferRequest(
            Product product,
            Seller seller,
            int quantity,
            String sellerNote,
            String pickupMode
    );
    List<WarehouseTransferResponse> getSellerTransfers(Long sellerId);
    List<WarehouseTransferResponse> getAllTransfers();
    WarehouseTransferResponse approveTransfer(Long transferId, String adminNote);
    WarehouseTransferResponse rejectTransfer(Long transferId, String rejectionReason);
    WarehouseTransferResponse planPickup(
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
    );
    WarehouseTransferResponse markPickedUp(Long transferId, String adminNote);
    WarehouseTransferResponse receiveTransfer(Long transferId, String adminNote);
    WarehouseTransferResponse cancelTransfer(Long transferId, Long sellerId);
}
