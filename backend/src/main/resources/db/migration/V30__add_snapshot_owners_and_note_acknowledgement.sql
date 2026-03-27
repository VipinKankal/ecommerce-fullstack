SET @schema_name := DATABASE();

SET @has_invoice_owner := (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = @schema_name
      AND table_name = 'order_tax_snapshots'
      AND column_name = 'invoice_owner'
);
SET @sql_invoice_owner := IF(
    @has_invoice_owner = 0,
    'ALTER TABLE order_tax_snapshots ADD COLUMN invoice_owner VARCHAR(32) NULL AFTER snapshot_source',
    'SELECT 1'
);
PREPARE stmt_invoice_owner FROM @sql_invoice_owner;
EXECUTE stmt_invoice_owner;
DEALLOCATE PREPARE stmt_invoice_owner;

SET @has_liability_owner := (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = @schema_name
      AND table_name = 'order_tax_snapshots'
      AND column_name = 'liability_owner'
);
SET @sql_liability_owner := IF(
    @has_liability_owner = 0,
    'ALTER TABLE order_tax_snapshots ADD COLUMN liability_owner VARCHAR(32) NULL AFTER invoice_owner',
    'SELECT 1'
);
PREPARE stmt_liability_owner FROM @sql_liability_owner;
EXECUTE stmt_liability_owner;
DEALLOCATE PREPARE stmt_liability_owner;

UPDATE order_tax_snapshots
SET invoice_owner = COALESCE(invoice_owner, 'SELLER'),
    liability_owner = COALESCE(liability_owner, 'SELLER')
WHERE invoice_owner IS NULL
   OR liability_owner IS NULL;

SET @has_acknowledged := (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = @schema_name
      AND table_name = 'compliance_seller_note_reads'
      AND column_name = 'acknowledged'
);
SET @sql_acknowledged := IF(
    @has_acknowledged = 0,
    'ALTER TABLE compliance_seller_note_reads ADD COLUMN acknowledged BIT NOT NULL DEFAULT 0 AFTER unread_at',
    'SELECT 1'
);
PREPARE stmt_acknowledged FROM @sql_acknowledged;
EXECUTE stmt_acknowledged;
DEALLOCATE PREPARE stmt_acknowledged;

SET @has_acknowledged_at := (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = @schema_name
      AND table_name = 'compliance_seller_note_reads'
      AND column_name = 'acknowledged_at'
);
SET @sql_acknowledged_at := IF(
    @has_acknowledged_at = 0,
    'ALTER TABLE compliance_seller_note_reads ADD COLUMN acknowledged_at DATETIME NULL AFTER acknowledged',
    'SELECT 1'
);
PREPARE stmt_acknowledged_at FROM @sql_acknowledged_at;
EXECUTE stmt_acknowledged_at;
DEALLOCATE PREPARE stmt_acknowledged_at;

SET @has_unacknowledged_at := (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = @schema_name
      AND table_name = 'compliance_seller_note_reads'
      AND column_name = 'unacknowledged_at'
);
SET @sql_unacknowledged_at := IF(
    @has_unacknowledged_at = 0,
    'ALTER TABLE compliance_seller_note_reads ADD COLUMN unacknowledged_at DATETIME NULL AFTER acknowledged_at',
    'SELECT 1'
);
PREPARE stmt_unacknowledged_at FROM @sql_unacknowledged_at;
EXECUTE stmt_unacknowledged_at;
DEALLOCATE PREPARE stmt_unacknowledged_at;

