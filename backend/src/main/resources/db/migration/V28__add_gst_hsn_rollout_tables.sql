SET @tax_schema := DATABASE();

SET @ddl := (
    SELECT IF(
        EXISTS(
            SELECT 1
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = @tax_schema
              AND TABLE_NAME = 'tax_rule_versions'
              AND COLUMN_NAME = 'value_basis'
        ),
        'SELECT 1',
        'ALTER TABLE tax_rule_versions ADD COLUMN value_basis VARCHAR(32) NULL'
    )
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl := (
    SELECT IF(
        EXISTS(
            SELECT 1
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = @tax_schema
              AND TABLE_NAME = 'tax_rule_versions'
              AND COLUMN_NAME = 'approval_status'
        ),
        'SELECT 1',
        'ALTER TABLE tax_rule_versions ADD COLUMN approval_status VARCHAR(32) NULL'
    )
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl := (
    SELECT IF(
        EXISTS(
            SELECT 1
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = @tax_schema
              AND TABLE_NAME = 'tax_rule_versions'
              AND COLUMN_NAME = 'approved_at'
        ),
        'SELECT 1',
        'ALTER TABLE tax_rule_versions ADD COLUMN approved_at DATETIME NULL'
    )
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl := (
    SELECT IF(
        EXISTS(
            SELECT 1
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = @tax_schema
              AND TABLE_NAME = 'tax_rule_versions'
              AND COLUMN_NAME = 'approved_by'
        ),
        'SELECT 1',
        'ALTER TABLE tax_rule_versions ADD COLUMN approved_by VARCHAR(120) NULL'
    )
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl := (
    SELECT IF(
        EXISTS(
            SELECT 1
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = @tax_schema
              AND TABLE_NAME = 'tax_rule_versions'
              AND COLUMN_NAME = 'signed_memo_reference'
        ),
        'SELECT 1',
        'ALTER TABLE tax_rule_versions ADD COLUMN signed_memo_reference VARCHAR(255) NULL'
    )
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE tax_rule_versions
SET value_basis = COALESCE(
        NULLIF(value_basis, ''),
        CASE
            WHEN rule_type = 'GST' AND UPPER(COALESCE(tax_class, '')) LIKE 'APPAREL%'
                THEN 'SELLING_PRICE_PER_PIECE'
            ELSE 'TAXABLE_VALUE'
        END
    ),
    approval_status = COALESCE(
        NULLIF(approval_status, ''),
        CASE
            WHEN published = 1 THEN 'CA_APPROVED'
            ELSE 'DRAFT'
        END
    ),
    approved_at = CASE
        WHEN published = 1 AND approved_at IS NULL THEN CURRENT_TIMESTAMP
        ELSE approved_at
    END,
    approved_by = CASE
        WHEN published = 1 AND (approved_by IS NULL OR approved_by = '') THEN 'SYSTEM_MIGRATION'
        ELSE approved_by
    END,
    signed_memo_reference = CASE
        WHEN published = 1 AND (signed_memo_reference IS NULL OR signed_memo_reference = '') THEN source_reference
        ELSE signed_memo_reference
    END;

CREATE TABLE IF NOT EXISTS hsn_master_rules (
    id BIGINT NOT NULL AUTO_INCREMENT,
    rule_code VARCHAR(120) NOT NULL,
    ui_category_key VARCHAR(120) NOT NULL,
    display_label VARCHAR(120) NOT NULL,
    construction_type VARCHAR(32) NULL,
    gender VARCHAR(32) NULL,
    fiber_family VARCHAR(64) NULL,
    hsn_chapter VARCHAR(8) NULL,
    hsn_code VARCHAR(16) NULL,
    tax_class VARCHAR(64) NULL,
    mapping_mode VARCHAR(32) NOT NULL,
    effective_from DATE NOT NULL,
    effective_to DATE NULL,
    approval_status VARCHAR(32) NOT NULL DEFAULT 'DRAFT',
    published BIT NOT NULL DEFAULT 0,
    source_reference VARCHAR(255) NULL,
    notes TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_hsn_master_rules_rule_code (rule_code),
    KEY idx_hsn_master_rules_lookup (ui_category_key, published, effective_from)
);

CREATE TABLE IF NOT EXISTS product_tax_reviews (
    id BIGINT NOT NULL AUTO_INCREMENT,
    product_id BIGINT NOT NULL,
    suggested_hsn_code VARCHAR(16) NULL,
    requested_hsn_code VARCHAR(16) NULL,
    override_reason TEXT NULL,
    review_status VARCHAR(32) NOT NULL DEFAULT 'PENDING_REVIEW',
    reviewer_note TEXT NULL,
    requested_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_product_tax_reviews_product_id (product_id),
    KEY idx_product_tax_reviews_status (review_status),
    CONSTRAINT fk_product_tax_reviews_product
        FOREIGN KEY (product_id) REFERENCES product(id)
        ON DELETE CASCADE
);

SET @ddl := (
    SELECT IF(
        EXISTS(
            SELECT 1
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = @tax_schema
              AND TABLE_NAME = 'product'
              AND COLUMN_NAME = 'ui_category_key'
        ),
        'SELECT 1',
        'ALTER TABLE product ADD COLUMN ui_category_key VARCHAR(120) NULL'
    )
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl := (
    SELECT IF(
        EXISTS(
            SELECT 1
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = @tax_schema
              AND TABLE_NAME = 'product'
              AND COLUMN_NAME = 'subcategory_key'
        ),
        'SELECT 1',
        'ALTER TABLE product ADD COLUMN subcategory_key VARCHAR(120) NULL'
    )
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl := (
    SELECT IF(
        EXISTS(
            SELECT 1
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = @tax_schema
              AND TABLE_NAME = 'product'
              AND COLUMN_NAME = 'gender'
        ),
        'SELECT 1',
        'ALTER TABLE product ADD COLUMN gender VARCHAR(32) NULL'
    )
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl := (
    SELECT IF(
        EXISTS(
            SELECT 1
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = @tax_schema
              AND TABLE_NAME = 'product'
              AND COLUMN_NAME = 'fabric_type'
        ),
        'SELECT 1',
        'ALTER TABLE product ADD COLUMN fabric_type VARCHAR(64) NULL'
    )
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl := (
    SELECT IF(
        EXISTS(
            SELECT 1
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = @tax_schema
              AND TABLE_NAME = 'product'
              AND COLUMN_NAME = 'construction_type'
        ),
        'SELECT 1',
        'ALTER TABLE product ADD COLUMN construction_type VARCHAR(32) NULL'
    )
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl := (
    SELECT IF(
        EXISTS(
            SELECT 1
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = @tax_schema
              AND TABLE_NAME = 'product'
              AND COLUMN_NAME = 'fiber_family'
        ),
        'SELECT 1',
        'ALTER TABLE product ADD COLUMN fiber_family VARCHAR(64) NULL'
    )
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl := (
    SELECT IF(
        EXISTS(
            SELECT 1
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = @tax_schema
              AND TABLE_NAME = 'product'
              AND COLUMN_NAME = 'hsn_selection_mode'
        ),
        'SELECT 1',
        'ALTER TABLE product ADD COLUMN hsn_selection_mode VARCHAR(32) NULL'
    )
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl := (
    SELECT IF(
        EXISTS(
            SELECT 1
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = @tax_schema
              AND TABLE_NAME = 'product'
              AND COLUMN_NAME = 'suggested_hsn_code'
        ),
        'SELECT 1',
        'ALTER TABLE product ADD COLUMN suggested_hsn_code VARCHAR(16) NULL'
    )
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl := (
    SELECT IF(
        EXISTS(
            SELECT 1
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = @tax_schema
              AND TABLE_NAME = 'product'
              AND COLUMN_NAME = 'override_requested_hsn_code'
        ),
        'SELECT 1',
        'ALTER TABLE product ADD COLUMN override_requested_hsn_code VARCHAR(16) NULL'
    )
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl := (
    SELECT IF(
        EXISTS(
            SELECT 1
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = @tax_schema
              AND TABLE_NAME = 'product'
              AND COLUMN_NAME = 'hsn_override_reason'
        ),
        'SELECT 1',
        'ALTER TABLE product ADD COLUMN hsn_override_reason TEXT NULL'
    )
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl := (
    SELECT IF(
        EXISTS(
            SELECT 1
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = @tax_schema
              AND TABLE_NAME = 'product'
              AND COLUMN_NAME = 'tax_review_status'
        ),
        'SELECT 1',
        'ALTER TABLE product ADD COLUMN tax_review_status VARCHAR(32) NULL'
    )
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE product
SET hsn_selection_mode = COALESCE(NULLIF(hsn_selection_mode, ''), 'AUTO_SUGGESTED'),
    tax_review_status = COALESCE(NULLIF(tax_review_status, ''), 'NOT_REQUIRED');

SET @ddl := (
    SELECT IF(
        EXISTS(
            SELECT 1
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = @tax_schema
              AND TABLE_NAME = 'seller'
              AND COLUMN_NAME = 'gst_registration_type'
        ),
        'SELECT 1',
        'ALTER TABLE seller ADD COLUMN gst_registration_type VARCHAR(32) NULL'
    )
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl := (
    SELECT IF(
        EXISTS(
            SELECT 1
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = @tax_schema
              AND TABLE_NAME = 'seller'
              AND COLUMN_NAME = 'gst_onboarding_policy'
        ),
        'SELECT 1',
        'ALTER TABLE seller ADD COLUMN gst_onboarding_policy VARCHAR(64) NULL'
    )
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl := (
    SELECT IF(
        EXISTS(
            SELECT 1
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = @tax_schema
              AND TABLE_NAME = 'seller'
              AND COLUMN_NAME = 'gst_declaration_accepted'
        ),
        'SELECT 1',
        'ALTER TABLE seller ADD COLUMN gst_declaration_accepted BIT NOT NULL DEFAULT 0'
    )
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl := (
    SELECT IF(
        EXISTS(
            SELECT 1
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = @tax_schema
              AND TABLE_NAME = 'seller'
              AND COLUMN_NAME = 'gst_compliance_status'
        ),
        'SELECT 1',
        'ALTER TABLE seller ADD COLUMN gst_compliance_status VARCHAR(32) NULL'
    )
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE seller
SET gst_registration_type = COALESCE(
        NULLIF(gst_registration_type, ''),
        CASE
            WHEN GSTIN IS NULL OR GSTIN = '' THEN 'NON_GST_DECLARATION'
            ELSE 'GST_REGISTERED'
        END
    ),
    gst_onboarding_policy = COALESCE(NULLIF(gst_onboarding_policy, ''), 'MANDATORY_ACTIVE_GSTIN'),
    gst_compliance_status = COALESCE(
        NULLIF(gst_compliance_status, ''),
        CASE
            WHEN GSTIN IS NULL OR GSTIN = '' THEN 'DECLARATION_PENDING'
            ELSE 'ACTIVE_GSTIN'
        END
    );

SET @ddl := (
    SELECT IF(
        EXISTS(
            SELECT 1
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = @tax_schema
              AND TABLE_NAME = 'order_tax_snapshots'
              AND COLUMN_NAME = 'effective_tax_date'
        ),
        'SELECT 1',
        'ALTER TABLE order_tax_snapshots ADD COLUMN effective_tax_date DATE NULL'
    )
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE order_tax_snapshots
SET effective_tax_date = COALESCE(effective_tax_date, DATE(frozen_at));

INSERT INTO hsn_master_rules (
    rule_code,
    ui_category_key,
    display_label,
    construction_type,
    gender,
    fiber_family,
    hsn_chapter,
    hsn_code,
    tax_class,
    mapping_mode,
    effective_from,
    effective_to,
    approval_status,
    published,
    source_reference,
    notes
)
SELECT
    seed.rule_code,
    seed.ui_category_key,
    seed.display_label,
    seed.construction_type,
    seed.gender,
    seed.fiber_family,
    seed.hsn_chapter,
    seed.hsn_code,
    seed.tax_class,
    seed.mapping_mode,
    seed.effective_from,
    seed.effective_to,
    seed.approval_status,
    seed.published,
    seed.source_reference,
    seed.notes
FROM (
    SELECT 'HSN_MEN_T_SHIRTS_KNIT' AS rule_code, 'men_t_shirts' AS ui_category_key, 'Men T-Shirts' AS display_label,
           'KNITTED' AS construction_type, 'MALE' AS gender, NULL AS fiber_family, '61' AS hsn_chapter,
           '6109' AS hsn_code, 'APPAREL_STANDARD' AS tax_class, 'DIRECT' AS mapping_mode,
           DATE '2023-04-01' AS effective_from, NULL AS effective_to, 'CA_APPROVED' AS approval_status,
           1 AS published, 'Initial CA apparel sheet' AS source_reference,
           'Knitted t-shirts map to chapter 61 HSN 6109' AS notes
    UNION ALL
    SELECT 'HSN_MEN_SHIRTS_WOVEN', 'men_shirts', 'Men Shirts', 'WOVEN', 'MALE', NULL, '62', '6205',
           'APPAREL_STANDARD', 'DIRECT', DATE '2023-04-01', NULL, 'CA_APPROVED', 1,
           'Initial CA apparel sheet', 'Woven men shirts map to 6205'
    UNION ALL
    SELECT 'HSN_MEN_JEANS_WOVEN', 'men_jeans', 'Men Jeans', 'WOVEN', 'MALE', NULL, '62', '6203',
           'APPAREL_STANDARD', 'DIRECT', DATE '2023-04-01', NULL, 'CA_APPROVED', 1,
           'Initial CA apparel sheet', 'Men jeans map to 6203 when sold as woven lowers'
    UNION ALL
    SELECT 'HSN_MEN_TROUSERS_WOVEN', 'men_trousers', 'Men Trousers', 'WOVEN', 'MALE', NULL, '62', '6203',
           'APPAREL_STANDARD', 'DIRECT', DATE '2023-04-01', NULL, 'CA_APPROVED', 1,
           'Initial CA apparel sheet', 'Men trousers map to 6203 when sold as woven lowers'
    UNION ALL
    SELECT 'HSN_WOMEN_TOPS_KNIT', 'tops', 'Women Tops', 'KNITTED', 'FEMALE', NULL, '61', '6110',
           'APPAREL_STANDARD', 'DIRECT', DATE '2023-04-01', NULL, 'CA_APPROVED', 1,
           'Initial CA apparel sheet', 'Knitted women tops map to chapter 61 knitwear'
    UNION ALL
    SELECT 'HSN_WOMEN_TOPS_WOVEN', 'tops', 'Women Tops', 'WOVEN', 'FEMALE', NULL, '62', '6206',
           'APPAREL_STANDARD', 'DIRECT', DATE '2023-04-01', NULL, 'CA_APPROVED', 1,
           'Initial CA apparel sheet', 'Woven women tops map to 6206'
    UNION ALL
    SELECT 'HSN_WOMEN_JEANS_WOVEN', 'jeans', 'Women Jeans', 'WOVEN', 'FEMALE', NULL, '62', '6204',
           'APPAREL_STANDARD', 'DIRECT', DATE '2023-04-01', NULL, 'CA_APPROVED', 1,
           'Initial CA apparel sheet', 'Women jeans map to 6204 when sold as woven lowers'
    UNION ALL
    SELECT 'HSN_WOMEN_KURTIS_WOVEN', 'kurtis', 'Kurtis', 'WOVEN', 'FEMALE', NULL, '62', '6204',
           'APPAREL_STANDARD', 'RULE_BASED', DATE '2023-04-01', NULL, 'CA_APPROVED', 1,
           'Initial CA apparel sheet', 'Final kurti mapping should remain CA-reviewed before auto-publish'
    UNION ALL
    SELECT 'HSN_SPORTY_JACKET_KNIT', 'sporty_jacket', 'Sporty Jacket', 'KNITTED', 'FEMALE', NULL, '61', '6102',
           'APPAREL_STANDARD', 'DIRECT', DATE '2023-04-01', NULL, 'CA_APPROVED', 1,
           'Initial CA apparel sheet', 'Knitted women jackets map to 6102'
    UNION ALL
    SELECT 'HSN_SAREE_FIBER_REQUIRED', 'saree', 'Saree', NULL, 'FEMALE', NULL, NULL, NULL,
           'TEXTILE_FIBER_BASED', 'FIBER_REQUIRED', DATE '2023-04-01', NULL, 'CA_APPROVED', 1,
           'CBIC FAQ fibre-based mapping guidance', 'Saree mapping depends on constituent fibre and must not be hardcoded'
    UNION ALL
    SELECT 'HSN_DHOTI_FIBER_REQUIRED', 'dhoti', 'Dhoti', NULL, 'MALE', NULL, NULL, NULL,
           'TEXTILE_FIBER_BASED', 'FIBER_REQUIRED', DATE '2023-04-01', NULL, 'CA_APPROVED', 1,
           'CBIC FAQ fibre-based mapping guidance', 'Dhoti mapping depends on constituent fibre and must not be hardcoded'
) AS seed
WHERE NOT EXISTS (
    SELECT 1 FROM hsn_master_rules existing WHERE existing.rule_code = seed.rule_code
);
