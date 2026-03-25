package com.example.ecommerce.modal;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@Table(name = "order_settlements")
public class OrderSettlement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false, unique = true)
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payment_order_id")
    private PaymentOrder paymentOrder;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seller_id")
    private Seller seller;

    @Column(name = "order_type", length = 32, nullable = false)
    private String orderType;

    @Column(name = "settlement_status", length = 32, nullable = false)
    private String settlementStatus;

    @Column(name = "gross_collected_amount")
    private Double grossCollectedAmount;

    @Column(name = "taxable_value")
    private Double taxableValue;

    @Column(name = "gst_amount")
    private Double gstAmount;

    @Column(name = "commission_amount")
    private Double commissionAmount;

    @Column(name = "commission_gst_amount")
    private Double commissionGstAmount;

    @Column(name = "tcs_rate_percentage")
    private Double tcsRatePercentage;

    @Column(name = "tcs_amount")
    private Double tcsAmount;

    @Column(name = "seller_payable_amount")
    private Double sellerPayableAmount;

    @Column(name = "seller_gst_liability_amount")
    private Double sellerGstLiabilityAmount;

    @Column(name = "admin_revenue_amount")
    private Double adminRevenueAmount;

    @Column(name = "admin_gst_liability_amount")
    private Double adminGstLiabilityAmount;

    @Column(name = "currency_code", length = 8)
    private String currencyCode;

    @Column(name = "payout_reference", length = 128)
    private String payoutReference;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "ledger_posted_at")
    private LocalDateTime ledgerPostedAt;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) {
            createdAt = now;
        }
        updatedAt = now;
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
