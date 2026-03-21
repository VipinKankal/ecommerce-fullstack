CREATE TABLE IF NOT EXISTS product_restock_subscriptions (
    id BIGINT NOT NULL AUTO_INCREMENT,
    product_id BIGINT NULL,
    user_id BIGINT NULL,
    status VARCHAR(64) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    notified_at DATETIME(6) NULL,
    converted_at DATETIME(6) NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_restock_subscription_product FOREIGN KEY (product_id) REFERENCES product (id),
    CONSTRAINT fk_restock_subscription_user FOREIGN KEY (user_id) REFERENCES user (id)
);

CREATE TABLE IF NOT EXISTS product_restock_notification_logs (
    id BIGINT NOT NULL AUTO_INCREMENT,
    subscription_id BIGINT NULL,
    product_id BIGINT NULL,
    user_id BIGINT NULL,
    status VARCHAR(64) NOT NULL,
    note VARCHAR(1200) NULL,
    created_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_restock_log_subscription FOREIGN KEY (subscription_id) REFERENCES product_restock_subscriptions (id),
    CONSTRAINT fk_restock_log_product FOREIGN KEY (product_id) REFERENCES product (id),
    CONSTRAINT fk_restock_log_user FOREIGN KEY (user_id) REFERENCES user (id)
);
