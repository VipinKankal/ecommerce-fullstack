CREATE TABLE IF NOT EXISTS compliance_challan_records (
    id BIGINT NOT NULL AUTO_INCREMENT,
    tax_stream VARCHAR(32) NOT NULL,
    filing_period VARCHAR(16) NOT NULL,
    amount DOUBLE NOT NULL,
    challan_reference VARCHAR(128) NOT NULL,
    payment_status VARCHAR(32) NOT NULL,
    paid_at DATETIME NULL,
    notes TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_compliance_challan_records_period (filing_period),
    KEY idx_compliance_challan_records_stream (tax_stream)
);