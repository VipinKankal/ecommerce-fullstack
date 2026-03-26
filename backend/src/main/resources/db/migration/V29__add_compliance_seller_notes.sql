CREATE TABLE IF NOT EXISTS compliance_seller_notes (
    id BIGINT NOT NULL AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    note_type VARCHAR(32) NOT NULL,
    priority VARCHAR(32) NOT NULL,
    short_summary VARCHAR(1200) NOT NULL,
    full_note TEXT NOT NULL,
    effective_date DATE NULL,
    action_required TEXT NULL,
    affected_category VARCHAR(120) NULL,
    business_email VARCHAR(255) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'DRAFT',
    pinned BIT NOT NULL DEFAULT 0,
    source_mode VARCHAR(32) NOT NULL DEFAULT 'MANUAL',
    attachments_json TEXT NULL,
    created_by VARCHAR(255) NULL,
    updated_by VARCHAR(255) NULL,
    published_at DATETIME NULL,
    archived_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_compliance_seller_notes_status (status, pinned, published_at, updated_at),
    KEY idx_compliance_seller_notes_type (note_type, status)
);

CREATE TABLE IF NOT EXISTS compliance_seller_note_reads (
    id BIGINT NOT NULL AUTO_INCREMENT,
    note_id BIGINT NOT NULL,
    seller_id BIGINT NOT NULL,
    is_read BIT NOT NULL DEFAULT 1,
    read_at DATETIME NULL,
    unread_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_compliance_seller_note_reads_note_seller (note_id, seller_id),
    KEY idx_compliance_seller_note_reads_seller (seller_id, is_read),
    KEY idx_compliance_seller_note_reads_note (note_id, is_read),
    CONSTRAINT fk_compliance_seller_note_reads_note
        FOREIGN KEY (note_id) REFERENCES compliance_seller_notes (id)
        ON DELETE CASCADE,
    CONSTRAINT fk_compliance_seller_note_reads_seller
        FOREIGN KEY (seller_id) REFERENCES seller (id)
        ON DELETE CASCADE
);

