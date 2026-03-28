SET @ops_schema := DATABASE();

SET @ddl := (
    SELECT IF(
        EXISTS(
            SELECT 1
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = @ops_schema
              AND TABLE_NAME = 'product'
              AND COLUMN_NAME = 'low_stock_threshold'
        ),
        'SELECT 1',
        'ALTER TABLE product ADD COLUMN low_stock_threshold INT NOT NULL DEFAULT 10'
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
            WHERE TABLE_SCHEMA = @ops_schema
              AND TABLE_NAME = 'warehouse_transfer_requests'
              AND COLUMN_NAME = 'pickup_proof_url'
        ),
        'SELECT 1',
        'ALTER TABLE warehouse_transfer_requests ADD COLUMN pickup_proof_url VARCHAR(1200) NULL'
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
            WHERE TABLE_SCHEMA = @ops_schema
              AND TABLE_NAME = 'warehouse_transfer_requests'
              AND COLUMN_NAME = 'receive_proof_url'
        ),
        'SELECT 1',
        'ALTER TABLE warehouse_transfer_requests ADD COLUMN receive_proof_url VARCHAR(1200) NULL'
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
            WHERE TABLE_SCHEMA = @ops_schema
              AND TABLE_NAME = 'order_return_exchange_requests'
              AND COLUMN_NAME = 'qc_result'
        ),
        'SELECT 1',
        'ALTER TABLE order_return_exchange_requests ADD COLUMN qc_result VARCHAR(255) NULL'
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
            WHERE TABLE_SCHEMA = @ops_schema
              AND TABLE_NAME = 'order_return_exchange_requests'
              AND COLUMN_NAME = 'warehouse_proof_url'
        ),
        'SELECT 1',
        'ALTER TABLE order_return_exchange_requests ADD COLUMN warehouse_proof_url VARCHAR(1200) NULL'
    )
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
