ALTER TABLE product
    ADD COLUMN warranty_type VARCHAR(32) NULL,
    ADD COLUMN warranty_days INT NOT NULL DEFAULT 0;

UPDATE product
SET warranty_type = 'NONE',
    warranty_days = 0
WHERE warranty_type IS NULL;

UPDATE product
SET warranty_type = 'BRAND'
WHERE UPPER(warranty_type) = 'MANUFACTURER';

ALTER TABLE orders
    ADD COLUMN delivered_at DATETIME(6) NULL;

UPDATE orders
SET delivered_at = delivery_date
WHERE delivered_at IS NULL
  AND order_status = 'DELIVERED'
  AND delivery_date IS NOT NULL;
