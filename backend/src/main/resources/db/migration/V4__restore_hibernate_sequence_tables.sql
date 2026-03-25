CREATE TABLE IF NOT EXISTS address_seq (
    next_val BIGINT
);
INSERT INTO address_seq (next_val)
SELECT 1
WHERE NOT EXISTS (SELECT 1 FROM address_seq);

CREATE TABLE IF NOT EXISTS cart_seq (
    next_val BIGINT
);
INSERT INTO cart_seq (next_val)
SELECT 1
WHERE NOT EXISTS (SELECT 1 FROM cart_seq);

CREATE TABLE IF NOT EXISTS category_seq (
    next_val BIGINT
);
INSERT INTO category_seq (next_val)
SELECT 1
WHERE NOT EXISTS (SELECT 1 FROM category_seq);

CREATE TABLE IF NOT EXISTS cart_item_seq (
    next_val BIGINT
);
INSERT INTO cart_item_seq (next_val)
SELECT 1
WHERE NOT EXISTS (SELECT 1 FROM cart_item_seq);

CREATE TABLE IF NOT EXISTS deal_seq (
    next_val BIGINT
);
INSERT INTO deal_seq (next_val)
SELECT 1
WHERE NOT EXISTS (SELECT 1 FROM deal_seq);

CREATE TABLE IF NOT EXISTS coupon_seq (
    next_val BIGINT
);
INSERT INTO coupon_seq (next_val)
SELECT 1
WHERE NOT EXISTS (SELECT 1 FROM coupon_seq);

CREATE TABLE IF NOT EXISTS coupon_event_log_seq (
    next_val BIGINT
);
INSERT INTO coupon_event_log_seq (next_val)
SELECT 1
WHERE NOT EXISTS (SELECT 1 FROM coupon_event_log_seq);

CREATE TABLE IF NOT EXISTS coupon_user_map_seq (
    next_val BIGINT
);
INSERT INTO coupon_user_map_seq (next_val)
SELECT 1
WHERE NOT EXISTS (SELECT 1 FROM coupon_user_map_seq);

CREATE TABLE IF NOT EXISTS coupon_usage_seq (
    next_val BIGINT
);
INSERT INTO coupon_usage_seq (next_val)
SELECT 1
WHERE NOT EXISTS (SELECT 1 FROM coupon_usage_seq);

CREATE TABLE IF NOT EXISTS orders_seq (
    next_val BIGINT
);
INSERT INTO orders_seq (next_val)
SELECT 1
WHERE NOT EXISTS (SELECT 1 FROM orders_seq);

CREATE TABLE IF NOT EXISTS home_category_seq (
    next_val BIGINT
);
INSERT INTO home_category_seq (next_val)
SELECT 1
WHERE NOT EXISTS (SELECT 1 FROM home_category_seq);

CREATE TABLE IF NOT EXISTS payment_order_seq (
    next_val BIGINT
);
INSERT INTO payment_order_seq (next_val)
SELECT 1
WHERE NOT EXISTS (SELECT 1 FROM payment_order_seq);

CREATE TABLE IF NOT EXISTS order_item_seq (
    next_val BIGINT
);
INSERT INTO order_item_seq (next_val)
SELECT 1
WHERE NOT EXISTS (SELECT 1 FROM order_item_seq);

CREATE TABLE IF NOT EXISTS seller_report_seq (
    next_val BIGINT
);
INSERT INTO seller_report_seq (next_val)
SELECT 1
WHERE NOT EXISTS (SELECT 1 FROM seller_report_seq);

CREATE TABLE IF NOT EXISTS product_variant_seq (
    next_val BIGINT
);
INSERT INTO product_variant_seq (next_val)
SELECT 1
WHERE NOT EXISTS (SELECT 1 FROM product_variant_seq);

CREATE TABLE IF NOT EXISTS product_restock_subscriptions_seq (
    next_val BIGINT
);
INSERT INTO product_restock_subscriptions_seq (next_val)
SELECT 1
WHERE NOT EXISTS (SELECT 1 FROM product_restock_subscriptions_seq);

CREATE TABLE IF NOT EXISTS product_restock_notification_logs_seq (
    next_val BIGINT
);
INSERT INTO product_restock_notification_logs_seq (next_val)
SELECT 1
WHERE NOT EXISTS (SELECT 1 FROM product_restock_notification_logs_seq);

CREATE TABLE IF NOT EXISTS wishlist_seq (
    next_val BIGINT
);
INSERT INTO wishlist_seq (next_val)
SELECT 1
WHERE NOT EXISTS (SELECT 1 FROM wishlist_seq);

CREATE TABLE IF NOT EXISTS seller_seq (
    next_val BIGINT
);
INSERT INTO seller_seq (next_val)
SELECT 1
WHERE NOT EXISTS (SELECT 1 FROM seller_seq);

CREATE TABLE IF NOT EXISTS verification_code_seq (
    next_val BIGINT
);
INSERT INTO verification_code_seq (next_val)
SELECT 1
WHERE NOT EXISTS (SELECT 1 FROM verification_code_seq);

CREATE TABLE IF NOT EXISTS review_seq (
    next_val BIGINT
);
INSERT INTO review_seq (next_val)
SELECT 1
WHERE NOT EXISTS (SELECT 1 FROM review_seq);

CREATE TABLE IF NOT EXISTS user_seq (
    next_val BIGINT
);
INSERT INTO user_seq (next_val)
SELECT 1
WHERE NOT EXISTS (SELECT 1 FROM user_seq);

CREATE TABLE IF NOT EXISTS product_seq (
    next_val BIGINT
);
INSERT INTO product_seq (next_val)
SELECT 1
WHERE NOT EXISTS (SELECT 1 FROM product_seq);

CREATE TABLE IF NOT EXISTS transaction_seq (
    next_val BIGINT
);
INSERT INTO transaction_seq (next_val)
SELECT 1
WHERE NOT EXISTS (SELECT 1 FROM transaction_seq);
