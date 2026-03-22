CREATE TABLE IF NOT EXISTS audit_log_entries (
    id BIGINT NOT NULL AUTO_INCREMENT,
    method VARCHAR(16) NOT NULL,
    path VARCHAR(255) NOT NULL,
    status INT NOT NULL,
    actor VARCHAR(255) NOT NULL,
    ip_address VARCHAR(64) NULL,
    duration_ms BIGINT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_audit_log_entries_created_at (created_at),
    INDEX idx_audit_log_entries_actor (actor),
    INDEX idx_audit_log_entries_path (path)
);
