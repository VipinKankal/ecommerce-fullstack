CREATE TABLE IF NOT EXISTS tax_rule_versions (
    id BIGINT NOT NULL AUTO_INCREMENT,
    rule_code VARCHAR(100) NOT NULL,
    rule_type VARCHAR(32) NOT NULL,
    tax_class VARCHAR(64) NULL,
    hsn_code VARCHAR(16) NULL,
    supply_type VARCHAR(32) NULL,
    min_taxable_value DOUBLE NULL,
    max_taxable_value DOUBLE NULL,
    rate_percentage DOUBLE NOT NULL,
    effective_from DATE NOT NULL,
    effective_to DATE NULL,
    published BIT NOT NULL DEFAULT 0,
    source_reference VARCHAR(255) NULL,
    notes TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_tax_rule_versions_rule_code (rule_code),
    KEY idx_tax_rule_versions_lookup (rule_type, published, effective_from)
);

INSERT INTO tax_rule_versions (
    rule_code,
    rule_type,
    tax_class,
    hsn_code,
    supply_type,
    min_taxable_value,
    max_taxable_value,
    rate_percentage,
    effective_from,
    effective_to,
    published,
    source_reference,
    notes
)
SELECT
    'APPAREL_GST_V2023_0401_LOW',
    'GST',
    'APPAREL_STANDARD',
    NULL,
    'ANY',
    0,
    1000,
    5,
    '2023-04-01',
    '2025-09-21',
    1,
    'CBIC rates as on 01-04-2023',
    'Apparel lower slab up to Rs 1000 per piece'
WHERE NOT EXISTS (
    SELECT 1 FROM tax_rule_versions WHERE rule_code = 'APPAREL_GST_V2023_0401_LOW'
);

INSERT INTO tax_rule_versions (
    rule_code,
    rule_type,
    tax_class,
    hsn_code,
    supply_type,
    min_taxable_value,
    max_taxable_value,
    rate_percentage,
    effective_from,
    effective_to,
    published,
    source_reference,
    notes
)
SELECT
    'APPAREL_GST_V2023_0401_HIGH',
    'GST',
    'APPAREL_STANDARD',
    NULL,
    'ANY',
    1000.01,
    NULL,
    12,
    '2023-04-01',
    '2025-09-21',
    1,
    'CBIC rates as on 01-04-2023',
    'Apparel higher slab above Rs 1000 per piece'
WHERE NOT EXISTS (
    SELECT 1 FROM tax_rule_versions WHERE rule_code = 'APPAREL_GST_V2023_0401_HIGH'
);

INSERT INTO tax_rule_versions (
    rule_code,
    rule_type,
    tax_class,
    hsn_code,
    supply_type,
    min_taxable_value,
    max_taxable_value,
    rate_percentage,
    effective_from,
    effective_to,
    published,
    source_reference,
    notes
)
SELECT
    'APPAREL_GST_V2025_0922_LOW',
    'GST',
    'APPAREL_STANDARD',
    NULL,
    'ANY',
    0,
    2500,
    5,
    '2025-09-22',
    NULL,
    1,
    '56th GST Council press pack',
    'Apparel lower slab up to Rs 2500 per piece'
WHERE NOT EXISTS (
    SELECT 1 FROM tax_rule_versions WHERE rule_code = 'APPAREL_GST_V2025_0922_LOW'
);

INSERT INTO tax_rule_versions (
    rule_code,
    rule_type,
    tax_class,
    hsn_code,
    supply_type,
    min_taxable_value,
    max_taxable_value,
    rate_percentage,
    effective_from,
    effective_to,
    published,
    source_reference,
    notes
)
SELECT
    'APPAREL_GST_V2025_0922_HIGH',
    'GST',
    'APPAREL_STANDARD',
    NULL,
    'ANY',
    2500.01,
    NULL,
    18,
    '2025-09-22',
    NULL,
    1,
    '56th GST Council press pack',
    'Apparel higher slab above Rs 2500 per piece'
WHERE NOT EXISTS (
    SELECT 1 FROM tax_rule_versions WHERE rule_code = 'APPAREL_GST_V2025_0922_HIGH'
);

INSERT INTO tax_rule_versions (
    rule_code,
    rule_type,
    tax_class,
    hsn_code,
    supply_type,
    min_taxable_value,
    max_taxable_value,
    rate_percentage,
    effective_from,
    effective_to,
    published,
    source_reference,
    notes
)
SELECT
    'TCS_IGST_V2024_0710',
    'TCS',
    'MARKETPLACE',
    NULL,
    'INTER_STATE',
    NULL,
    NULL,
    0.5,
    '2024-07-10',
    NULL,
    1,
    'Notification 01/2024-Integrated Tax',
    'TCS for inter-state supplies through ECO'
WHERE NOT EXISTS (
    SELECT 1 FROM tax_rule_versions WHERE rule_code = 'TCS_IGST_V2024_0710'
);

INSERT INTO tax_rule_versions (
    rule_code,
    rule_type,
    tax_class,
    hsn_code,
    supply_type,
    min_taxable_value,
    max_taxable_value,
    rate_percentage,
    effective_from,
    effective_to,
    published,
    source_reference,
    notes
)
SELECT
    'TCS_CGST_V2024_0710',
    'TCS',
    'MARKETPLACE',
    NULL,
    'INTRA_STATE',
    NULL,
    NULL,
    0.25,
    '2024-07-10',
    NULL,
    1,
    'Notification 15/2024-Central Tax',
    'CGST-side TCS for intra-state supplies through ECO'
WHERE NOT EXISTS (
    SELECT 1 FROM tax_rule_versions WHERE rule_code = 'TCS_CGST_V2024_0710'
);
