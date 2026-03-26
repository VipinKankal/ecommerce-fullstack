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
        name = "compliance_seller_notes",
        indexes = {
                @Index(name = "idx_compliance_seller_notes_status", columnList = "status,pinned,published_at,updated_at"),
                @Index(name = "idx_compliance_seller_notes_type", columnList = "note_type,status")
        }
)
public class ComplianceSellerNote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "title", nullable = false, length = 255)
    private String title;

    @Column(name = "note_type", nullable = false, length = 32)
    private String noteType;

    @Column(name = "priority", nullable = false, length = 32)
    private String priority;

    @Column(name = "short_summary", nullable = false, length = 1200)
    private String shortSummary;

    @Column(name = "full_note", nullable = false, columnDefinition = "TEXT")
    private String fullNote;

    @Column(name = "effective_date")
    private LocalDate effectiveDate;

    @Column(name = "action_required", columnDefinition = "TEXT")
    private String actionRequired;

    @Column(name = "affected_category", length = 120)
    private String affectedCategory;

    @Column(name = "business_email", nullable = false, length = 255)
    private String businessEmail;

    @Column(name = "status", nullable = false, length = 32)
    private String status;

    @Column(name = "pinned", nullable = false)
    private boolean pinned;

    @Column(name = "source_mode", nullable = false, length = 32)
    private String sourceMode;

    @Column(name = "attachments_json", columnDefinition = "TEXT")
    private String attachmentsJson;

    @Column(name = "created_by", length = 255)
    private String createdBy;

    @Column(name = "updated_by", length = 255)
    private String updatedBy;

    @Column(name = "published_at")
    private LocalDateTime publishedAt;

    @Column(name = "archived_at")
    private LocalDateTime archivedAt;

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
        if (status == null || status.isBlank()) {
            status = "DRAFT";
        }
        if (sourceMode == null || sourceMode.isBlank()) {
            sourceMode = "MANUAL";
        }
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}

