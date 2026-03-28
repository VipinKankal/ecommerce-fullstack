SET @migration_schema := DATABASE();

SET @ddl := (
    SELECT IF(
        EXISTS(
            SELECT 1
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = @migration_schema
              AND TABLE_NAME = 'orders'
              AND COLUMN_NAME = 'payment_method'
        ),
        'SELECT 1',
        'ALTER TABLE orders ADD COLUMN payment_method VARCHAR(64) NULL'
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
            WHERE TABLE_SCHEMA = @migration_schema
              AND TABLE_NAME = 'orders'
              AND COLUMN_NAME = 'payment_type'
        ),
        'SELECT 1',
        'ALTER TABLE orders ADD COLUMN payment_type VARCHAR(64) NULL'
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
            WHERE TABLE_SCHEMA = @migration_schema
              AND TABLE_NAME = 'orders'
              AND COLUMN_NAME = 'provider'
        ),
        'SELECT 1',
        'ALTER TABLE orders ADD COLUMN provider VARCHAR(64) NULL'
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
            WHERE TABLE_SCHEMA = @migration_schema
              AND TABLE_NAME = 'payment_order'
              AND COLUMN_NAME = 'payment_type'
        ),
        'SELECT 1',
        'ALTER TABLE payment_order ADD COLUMN payment_type VARCHAR(64) NULL'
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
            WHERE TABLE_SCHEMA = @migration_schema
              AND TABLE_NAME = 'payment_order'
              AND COLUMN_NAME = 'provider'
        ),
        'SELECT 1',
        'ALTER TABLE payment_order ADD COLUMN provider VARCHAR(64) NULL'
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
            WHERE TABLE_SCHEMA = @migration_schema
              AND TABLE_NAME = 'payment_order'
              AND COLUMN_NAME = 'merchant_transaction_id'
        ),
        'SELECT 1',
        'ALTER TABLE payment_order ADD COLUMN merchant_transaction_id VARCHAR(128) NULL'
    )
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE payment_order
SET payment_method = CASE CAST(payment_method AS CHAR)
    WHEN 'RAZORPAY' THEN 'UPI'
    WHEN 'PHONEPE' THEN 'UPI'
    WHEN 'ONLINE' THEN 'UPI'
    WHEN 'STRIPE' THEN 'CARD'
    ELSE payment_method
END;

UPDATE payment_order
SET payment_type = CASE CAST(payment_method AS CHAR)
    WHEN 'COD' THEN 'CASH'
    WHEN 'UPI' THEN 'UPI'
    WHEN 'CARD' THEN 'CARD'
    ELSE payment_type
END
WHERE payment_type IS NULL;

UPDATE payment_order
SET provider = CASE
    WHEN provider IS NOT NULL AND provider <> '' THEN provider
    WHEN payment_method = 'UPI' THEN 'PHONEPE'
    WHEN payment_method = 'CARD' THEN 'STRIPE'
    ELSE provider
END;

UPDATE payment_order
SET merchant_transaction_id = payment_link_id
WHERE merchant_transaction_id IS NULL
  AND payment_link_id IS NOT NULL
  AND payment_link_id <> '';

UPDATE orders
SET payment_status = CASE CAST(payment_status AS CHAR)
    WHEN 'COMPLETED' THEN 'SUCCESS'
    ELSE payment_status
END;

UPDATE orders
SET status = CASE CAST(status AS CHAR)
    WHEN 'COMPLETED' THEN 'SUCCESS'
    ELSE status
END;

UPDATE payment_order
SET status = CASE CAST(status AS CHAR)
    WHEN 'COMPLETED' THEN 'SUCCESS'
    ELSE status
END;
