package com.example.ecommerce.modal;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@Table(
        name = "tax_rule_versions",
        indexes = {
                @Index(name = "idx_tax_rule_versions_lookup", columnList = "rule_type,published,effective_from"),
                @Index(name = "idx_tax_rule_versions_code", columnList = "rule_code", unique = true)
        }
)
public class TaxRuleVersion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "rule_code", nullable = false, unique = true, length = 100)
    private String ruleCode;

    @Column(name = "rule_type", nullable = false, length = 32)
    private String ruleType;

    @Column(name = "tax_class", length = 64)
    private String taxClass;

    @Column(name = "hsn_code", length = 16)
    private String hsnCode;

    @Column(name = "supply_type", length = 32)
    private String supplyType;

    @Column(name = "min_taxable_value")
    private Double minTaxableValue;

    @Column(name = "max_taxable_value")
    private Double maxTaxableValue;

    @Column(name = "rate_percentage", nullable = false)
    private Double ratePercentage;

    @Column(name = "effective_from", nullable = false)
    private LocalDate effectiveFrom;

    @Column(name = "effective_to")
    private LocalDate effectiveTo;

    @Column(name = "published", nullable = false)
    private boolean published;

    @Column(name = "source_reference", length = 255)
    private String sourceReference;

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
        updatedAt = now;
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
