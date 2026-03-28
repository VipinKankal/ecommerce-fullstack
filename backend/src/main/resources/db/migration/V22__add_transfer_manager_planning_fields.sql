SET @transfer_schema := DATABASE();

SET @ddl := (
    SELECT IF(
        EXISTS(
            SELECT 1
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = @transfer_schema
              AND TABLE_NAME = 'warehouse_transfer_requests'
              AND COLUMN_NAME = 'package_type'
        ),
        'SELECT 1',
        'ALTER TABLE warehouse_transfer_requests ADD COLUMN package_type VARCHAR(64) NULL'
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
            WHERE TABLE_SCHEMA = @transfer_schema
              AND TABLE_NAME = 'warehouse_transfer_requests'
              AND COLUMN_NAME = 'pickup_ready_at'
        ),
        'SELECT 1',
        'ALTER TABLE warehouse_transfer_requests ADD COLUMN pickup_ready_at DATETIME(6) NULL'
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
            WHERE TABLE_SCHEMA = @transfer_schema
              AND TABLE_NAME = 'warehouse_transfer_requests'
              AND COLUMN_NAME = 'pickup_address_verified'
        ),
        'SELECT 1',
        'ALTER TABLE warehouse_transfer_requests ADD COLUMN pickup_address_verified BIT NULL'
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
            WHERE TABLE_SCHEMA = @transfer_schema
              AND TABLE_NAME = 'warehouse_transfer_requests'
              AND COLUMN_NAME = 'transport_mode'
        ),
        'SELECT 1',
        'ALTER TABLE warehouse_transfer_requests ADD COLUMN transport_mode VARCHAR(64) NULL'
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
            WHERE TABLE_SCHEMA = @transfer_schema
              AND TABLE_NAME = 'warehouse_transfer_requests'
              AND COLUMN_NAME = 'assigned_courier_name'
        ),
        'SELECT 1',
        'ALTER TABLE warehouse_transfer_requests ADD COLUMN assigned_courier_name VARCHAR(255) NULL'
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
            WHERE TABLE_SCHEMA = @transfer_schema
              AND TABLE_NAME = 'warehouse_transfer_requests'
              AND COLUMN_NAME = 'transporter_name'
        ),
        'SELECT 1',
        'ALTER TABLE warehouse_transfer_requests ADD COLUMN transporter_name VARCHAR(255) NULL'
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
            WHERE TABLE_SCHEMA = @transfer_schema
              AND TABLE_NAME = 'warehouse_transfer_requests'
              AND COLUMN_NAME = 'invoice_number'
        ),
        'SELECT 1',
        'ALTER TABLE warehouse_transfer_requests ADD COLUMN invoice_number VARCHAR(255) NULL'
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
            WHERE TABLE_SCHEMA = @transfer_schema
              AND TABLE_NAME = 'warehouse_transfer_requests'
              AND COLUMN_NAME = 'challan_number'
        ),
        'SELECT 1',
        'ALTER TABLE warehouse_transfer_requests ADD COLUMN challan_number VARCHAR(255) NULL'
    )
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
