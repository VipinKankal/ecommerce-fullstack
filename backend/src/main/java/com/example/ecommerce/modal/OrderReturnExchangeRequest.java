package com.example.ecommerce.modal;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "order_return_exchange_requests")
public class OrderReturnExchangeRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private String requestNumber;

    private String requestType;
    private String status;

    private Long orderId;
    private Long orderItemId;
    private Long customerId;
    private String customerName;
    private Long sellerId;

    private Long productId;
    private String productTitle;
    private String productImage;
    private Integer quantityRequested;
    private String reasonCode;

    @Column(length = 2000)
    private String customerComment;

    @Column(length = 1200)
    private String adminComment;

    @Column(length = 1200)
    private String rejectionReason;

    private Long courierId;
    private String courierName;

    private Long requestedNewProductId;
    private String requestedNewProductTitle;
    private String requestedNewProductImage;
    private String requestedVariant;

    @Column(length = 1200)
    private String productPhoto;

    private String qcResult;

    @Column(length = 1200)
    private String warehouseProofUrl;

    private Integer oldPrice;
    private Integer newPrice;
    private Integer priceDifference;
    private String balanceMode;
    private String paymentReference;

    private String refundStatus;
    private LocalDateTime refundEligibleAfter;
    private String walletCreditStatus;
    private String bankRefundStatus;

    private String bankAccountHolderName;
    private String bankAccountNumber;
    private String bankIfscCode;
    private String bankName;
    private String bankUpiId;

    private Long replacementOrderId;

    private LocalDateTime requestedAt = LocalDateTime.now();
    private LocalDateTime approvedAt;
    private LocalDateTime adminReviewedAt;
    private LocalDateTime pickupScheduledAt;
    private LocalDateTime pickupCompletedAt;
    private LocalDateTime receivedAt;
    private LocalDateTime refundInitiatedAt;
    private LocalDateTime refundCompletedAt;
    private LocalDateTime paymentCompletedAt;
    private LocalDateTime walletCreditCompletedAt;
    private LocalDateTime bankRefundInitiatedAt;
    private LocalDateTime bankRefundCompletedAt;
    private LocalDateTime replacementCreatedAt;
    private LocalDateTime replacementShippedAt;
    @Column(length = 1200)
    private String replacementProofUrl;
    private LocalDateTime replacementDeliveredAt;
    private LocalDateTime completedAt;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(
            name = "order_return_exchange_request_history",
            joinColumns = @JoinColumn(name = "request_id")
    )
    @OrderColumn(name = "history_index")
    private List<RequestHistoryEntry> history = new ArrayList<>();
}
