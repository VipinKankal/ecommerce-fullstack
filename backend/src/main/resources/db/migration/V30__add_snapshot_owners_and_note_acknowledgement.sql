ALTER TABLE order_tax_snapshots
    ADD COLUMN IF NOT EXISTS invoice_owner VARCHAR(32) NULL AFTER snapshot_source,
    ADD COLUMN IF NOT EXISTS liability_owner VARCHAR(32) NULL AFTER invoice_owner;

UPDATE order_tax_snapshots
SET invoice_owner = COALESCE(invoice_owner, 'SELLER'),
    liability_owner = COALESCE(liability_owner, 'SELLER')
WHERE invoice_owner IS NULL
   OR liability_owner IS NULL;

ALTER TABLE compliance_seller_note_reads
    ADD COLUMN IF NOT EXISTS acknowledged BIT NOT NULL DEFAULT 0 AFTER unread_at,
    ADD COLUMN IF NOT EXISTS acknowledged_at DATETIME NULL AFTER acknowledged,
    ADD COLUMN IF NOT EXISTS unacknowledged_at DATETIME NULL AFTER acknowledged_at;

