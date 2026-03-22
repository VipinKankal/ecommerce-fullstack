ALTER TABLE warehouse_transfer_requests
    ADD COLUMN IF NOT EXISTS package_type VARCHAR(64) NULL,
    ADD COLUMN IF NOT EXISTS pickup_ready_at DATETIME(6) NULL,
    ADD COLUMN IF NOT EXISTS pickup_address_verified BIT NULL,
    ADD COLUMN IF NOT EXISTS transport_mode VARCHAR(64) NULL,
    ADD COLUMN IF NOT EXISTS assigned_courier_name VARCHAR(255) NULL,
    ADD COLUMN IF NOT EXISTS transporter_name VARCHAR(255) NULL,
    ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(255) NULL,
    ADD COLUMN IF NOT EXISTS challan_number VARCHAR(255) NULL;
