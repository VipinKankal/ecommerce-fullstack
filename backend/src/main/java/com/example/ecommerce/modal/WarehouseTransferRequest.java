package com.example.ecommerce.modal;

import com.example.ecommerce.common.domain.WarehouseTransferStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "warehouse_transfer_requests")
public class WarehouseTransferRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id")
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seller_id")
    private Seller seller;

    @Column(nullable = false)
    private Integer quantity;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 64)
    private WarehouseTransferStatus status = WarehouseTransferStatus.TRANSFER_PENDING;

    @Column(length = 1200)
    private String sellerNote;

    @Column(length = 1200)
    private String adminNote;

    @Column(length = 1200)
    private String rejectionReason;

    @Column(length = 1200)
    private String pickupProofUrl;

    @Column(length = 1200)
    private String receiveProofUrl;

    @Column(length = 64)
    private String pickupMode;

    private Double estimatedWeightKg;

    private Integer packageCount;

    @Column(length = 64)
    private String preferredVehicle;

    @Column(length = 64)
    private String suggestedVehicle;

    private Integer estimatedPickupHours;

    private Integer estimatedLogisticsCharge;

    @Column(length = 64)
    private String packageType;

    private LocalDateTime pickupReadyAt;

    private Boolean pickupAddressVerified;

    @Column(length = 64)
    private String transportMode;

    @Column(length = 255)
    private String assignedCourierName;

    @Column(length = 255)
    private String transporterName;

    @Column(length = 255)
    private String invoiceNumber;

    @Column(length = 255)
    private String challanNumber;

    @Column(nullable = false)
    private LocalDateTime requestedAt = LocalDateTime.now();

    private LocalDateTime approvedAt;
    private LocalDateTime pickedUpAt;
    private LocalDateTime receivedAt;
    private LocalDateTime cancelledAt;
}
