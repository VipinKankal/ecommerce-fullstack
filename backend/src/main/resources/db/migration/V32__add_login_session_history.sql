CREATE TABLE IF NOT EXISTS login_session_entries (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(64) NOT NULL,
    principal_email VARCHAR(255) NOT NULL,
    principal_role VARCHAR(32) NOT NULL,
    device_key VARCHAR(128) NOT NULL,
    device_label VARCHAR(160) NOT NULL,
    ip_address VARCHAR(64) NULL,
    user_agent VARCHAR(512) NULL,
    login_at DATETIME(6) NOT NULL,
    token_expires_at DATETIME(6) NOT NULL,
    logged_out_at DATETIME(6) NULL,
    UNIQUE KEY uk_login_session_entries_session_id (session_id),
    KEY idx_login_session_entries_principal (principal_email, principal_role, login_at),
    KEY idx_login_session_entries_active (principal_email, principal_role, logged_out_at, token_expires_at),
    KEY idx_login_session_entries_device (principal_email, principal_role, device_key)
);
