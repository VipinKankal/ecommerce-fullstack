-- Performance-focused indexes for common query patterns.
-- Uses conditional creation so migration can be re-run safely across environments.

-- verification_code(email, created_at)
SET @idx_exists := (
    SELECT COUNT(1)
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'verification_code'
      AND index_name = 'idx_verification_code_email_created'
);
SET @sql := IF(
    @idx_exists = 0,
    'CREATE INDEX idx_verification_code_email_created ON verification_code (email, created_at)',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- orders(seller_id)
SET @idx_exists := (
    SELECT COUNT(1)
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'orders'
      AND index_name = 'idx_orders_seller_id'
);
SET @sql := IF(
    @idx_exists = 0,
    'CREATE INDEX idx_orders_seller_id ON orders (seller_id)',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- orders(user_id)
SET @idx_exists := (
    SELECT COUNT(1)
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'orders'
      AND index_name = 'idx_orders_user_id'
);
SET @sql := IF(
    @idx_exists = 0,
    'CREATE INDEX idx_orders_user_id ON orders (user_id)',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- product(seller_id)
SET @idx_exists := (
    SELECT COUNT(1)
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'product'
      AND index_name = 'idx_product_seller_id'
);
SET @sql := IF(
    @idx_exists = 0,
    'CREATE INDEX idx_product_seller_id ON product (seller_id)',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- cart_item(user_id)
SET @idx_exists := (
    SELECT COUNT(1)
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'cart_item'
      AND index_name = 'idx_cart_item_user_id'
);
SET @sql := IF(
    @idx_exists = 0,
    'CREATE INDEX idx_cart_item_user_id ON cart_item (user_id)',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
