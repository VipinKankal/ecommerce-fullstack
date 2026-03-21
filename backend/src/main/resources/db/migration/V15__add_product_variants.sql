CREATE TABLE IF NOT EXISTS product_variants (
    id BIGINT NOT NULL AUTO_INCREMENT,
    product_id BIGINT NULL,
    variant_type VARCHAR(255) NULL,
    variant_value VARCHAR(255) NULL,
    size VARCHAR(255) NULL,
    color VARCHAR(255) NULL,
    sku VARCHAR(255) NULL,
    price INT NULL,
    seller_stock INT NULL,
    warehouse_stock INT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_product_variant_product FOREIGN KEY (product_id) REFERENCES product (id)
);
