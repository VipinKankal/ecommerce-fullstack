ALTER TABLE product
    ADD COLUMN IF NOT EXISTS low_stock_threshold INT NOT NULL DEFAULT 10;

ALTER TABLE warehouse_transfer_requests
    ADD COLUMN IF NOT EXISTS pickup_proof_url VARCHAR(1200) NULL,
    ADD COLUMN IF NOT EXISTS receive_proof_url VARCHAR(1200) NULL;

ALTER TABLE order_return_exchange_requests
    ADD COLUMN IF NOT EXISTS qc_result VARCHAR(255) NULL,
    ADD COLUMN IF NOT EXISTS warehouse_proof_url VARCHAR(1200) NULL;
