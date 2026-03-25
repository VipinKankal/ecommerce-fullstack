SET @product_schema := DATABASE();

SET @ddl := (
    SELECT IF(
        EXISTS(
            SELECT 1
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = @product_schema
              AND TABLE_NAME = 'product'
              AND COLUMN_NAME = 'hsn_code'
        ),
        'SELECT 1',
        'ALTER TABLE product ADD COLUMN hsn_code VARCHAR(16) NULL'
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
            WHERE TABLE_SCHEMA = @product_schema
              AND TABLE_NAME = 'product'
              AND COLUMN_NAME = 'pricing_mode'
        ),
        'SELECT 1',
        'ALTER TABLE product ADD COLUMN pricing_mode VARCHAR(32) NULL'
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
            WHERE TABLE_SCHEMA = @product_schema
              AND TABLE_NAME = 'product'
              AND COLUMN_NAME = 'tax_class'
        ),
        'SELECT 1',
        'ALTER TABLE product ADD COLUMN tax_class VARCHAR(64) NULL'
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
            WHERE TABLE_SCHEMA = @product_schema
              AND TABLE_NAME = 'product'
              AND COLUMN_NAME = 'tax_rule_version'
        ),
        'SELECT 1',
        'ALTER TABLE product ADD COLUMN tax_rule_version VARCHAR(100) NULL'
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
            WHERE TABLE_SCHEMA = @product_schema
              AND TABLE_NAME = 'product'
              AND COLUMN_NAME = 'tax_percentage'
        ),
        'SELECT 1',
        'ALTER TABLE product ADD COLUMN tax_percentage DOUBLE NULL'
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
            WHERE TABLE_SCHEMA = @product_schema
              AND TABLE_NAME = 'product'
              AND COLUMN_NAME = 'cost_price'
        ),
        'SELECT 1',
        'ALTER TABLE product ADD COLUMN cost_price DOUBLE NULL'
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
            WHERE TABLE_SCHEMA = @product_schema
              AND TABLE_NAME = 'product'
              AND COLUMN_NAME = 'platform_commission'
        ),
        'SELECT 1',
        'ALTER TABLE product ADD COLUMN platform_commission DOUBLE NULL'
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
            WHERE TABLE_SCHEMA = @product_schema
              AND TABLE_NAME = 'product'
              AND COLUMN_NAME = 'currency_code'
        ),
        'SELECT 1',
        'ALTER TABLE product ADD COLUMN currency_code VARCHAR(8) NULL'
    )
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE product
SET pricing_mode = COALESCE(NULLIF(pricing_mode, ''), 'INCLUSIVE'),
    tax_class = COALESCE(NULLIF(tax_class, ''), 'APPAREL_STANDARD'),
    tax_rule_version = COALESCE(NULLIF(tax_rule_version, ''), 'AUTO_ACTIVE'),
    tax_percentage = COALESCE(tax_percentage, 0),
    cost_price = COALESCE(cost_price, 0),
    platform_commission = COALESCE(platform_commission, 0),
    currency_code = COALESCE(NULLIF(currency_code, ''), 'INR');
