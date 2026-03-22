ALTER TABLE orders
    ADD COLUMN shipped_at DATETIME(6) NULL;

ALTER TABLE order_return_exchange_requests
    ADD COLUMN replacement_proof_url VARCHAR(1200) NULL;
