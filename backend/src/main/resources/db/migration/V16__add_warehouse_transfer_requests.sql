CREATE TABLE IF NOT EXISTS warehouse_transfer_requests (
    id BIGINT NOT NULL AUTO_INCREMENT,
    product_id BIGINT NULL,
    seller_id BIGINT NULL,
    quantity INT NOT NULL,
    status VARCHAR(64) NOT NULL,
    seller_note VARCHAR(1200) NULL,
    admin_note VARCHAR(1200) NULL,
    rejection_reason VARCHAR(1200) NULL,
    requested_at DATETIME(6) NOT NULL,
    approved_at DATETIME(6) NULL,
    picked_up_at DATETIME(6) NULL,
    received_at DATETIME(6) NULL,
    cancelled_at DATETIME(6) NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_warehouse_transfer_product FOREIGN KEY (product_id) REFERENCES product (id),
    CONSTRAINT fk_warehouse_transfer_seller FOREIGN KEY (seller_id) REFERENCES seller (id)
);
