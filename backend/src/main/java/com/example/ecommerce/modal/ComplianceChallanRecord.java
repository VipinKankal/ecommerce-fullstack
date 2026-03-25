package com.example.ecommerce.modal;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@Table(name = "compliance_challan_records")
public class ComplianceChallanRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tax_stream", length = 32, nullable = false)
    private String taxStream;

    @Column(name = "filing_period", length = 16, nullable = false)
    private String filingPeriod;

    @Column(name = "amount", nullable = false)
    private Double amount;

    @Column(name = "challan_reference", length = 128, nullable = false)
    private String challanReference;

    @Column(name = "payment_status", length = 32, nullable = false)
    private String paymentStatus;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

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
        if (paidAt == null) {
            paidAt = now;
        }
        updatedAt = now;
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}