package com.example.ecommerce.modal;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@Table(name = "order_tax_snapshots")
public class OrderTaxSnapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false, unique = true)
    private Order order;

    @Column(name = "order_type", length = 32, nullable = false)
    private String orderType;

    @Column(name = "supplier_gstin", length = 20)
    private String supplierGstin;

    @Column(name = "seller_state_code", length = 8)
    private String sellerStateCode;

    @Column(name = "pos_state_code", length = 8)
    private String posStateCode;

    @Column(name = "supply_type", length = 32)
    private String supplyType;

    @Column(name = "total_taxable_value")
    private Double totalTaxableValue;

    @Column(name = "total_gst_amount")
    private Double totalGstAmount;

    @Column(name = "total_amount_charged")
    private Double totalAmountCharged;

    @Column(name = "total_amount_with_tax")
    private Double totalAmountWithTax;

    @Column(name = "total_commission_amount")
    private Double totalCommissionAmount;

    @Column(name = "total_commission_gst_amount")
    private Double totalCommissionGstAmount;

    @Column(name = "tcs_rate_percentage")
    private Double tcsRatePercentage;

    @Column(name = "tcs_amount")
    private Double tcsAmount;

    @Column(name = "gst_rule_version", length = 100)
    private String gstRuleVersion;

    @Column(name = "tcs_rule_version", length = 100)
    private String tcsRuleVersion;

    @Column(name = "snapshot_source", length = 64)
    private String snapshotSource;

    @Column(name = "effective_tax_date")
    private LocalDate effectiveTaxDate;

    @Column(name = "snapshot_payload", columnDefinition = "LONGTEXT")
    private String snapshotPayload;

    @Column(name = "frozen_at", nullable = false)
    private LocalDateTime frozenAt;

    @PrePersist
    public void prePersist() {
        if (frozenAt == null) {
            frozenAt = LocalDateTime.now();
        }
    }
}
