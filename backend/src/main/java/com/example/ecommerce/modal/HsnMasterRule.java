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
        name = "hsn_master_rules",
        indexes = {
                @Index(name = "idx_hsn_master_rules_lookup", columnList = "ui_category_key,published,effective_from"),
                @Index(name = "uk_hsn_master_rules_rule_code", columnList = "rule_code", unique = true)
        }
)
public class HsnMasterRule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "rule_code", nullable = false, unique = true, length = 120)
    private String ruleCode;

    @Column(name = "ui_category_key", nullable = false, length = 120)
    private String uiCategoryKey;

    @Column(name = "display_label", nullable = false, length = 120)
    private String displayLabel;

    @Column(name = "construction_type", length = 32)
    private String constructionType;

    @Column(name = "gender", length = 32)
    private String gender;

    @Column(name = "fiber_family", length = 64)
    private String fiberFamily;

    @Column(name = "hsn_chapter", length = 8)
    private String hsnChapter;

    @Column(name = "hsn_code", length = 16)
    private String hsnCode;

    @Column(name = "tax_class", length = 64)
    private String taxClass;

    @Column(name = "mapping_mode", nullable = false, length = 32)
    private String mappingMode;

    @Column(name = "effective_from", nullable = false)
    private LocalDate effectiveFrom;

    @Column(name = "effective_to")
    private LocalDate effectiveTo;

    @Column(name = "approval_status", nullable = false, length = 32)
    private String approvalStatus;

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
