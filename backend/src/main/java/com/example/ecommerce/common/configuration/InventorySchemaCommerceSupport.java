package com.example.ecommerce.common.configuration;

final class InventorySchemaCommerceSupport {

    private final InventorySchemaSupport schemaSupport;

    InventorySchemaCommerceSupport(InventorySchemaSupport schemaSupport) {
        this.schemaSupport = schemaSupport;
    }

    void ensureLegacyStatusColumnsCompatible() {
        schemaSupport.ensureColumnType("orders", "order_status", "VARCHAR(64) NULL");
        schemaSupport.ensureColumnType("orders", "payment_status", "VARCHAR(64) NULL");
        schemaSupport.ensureColumnType("orders", "status", "VARCHAR(64) NULL");
        schemaSupport.ensureColumnType("payment_order", "status", "VARCHAR(64) NULL");
        schemaSupport.ensureColumnType("payment_order", "payment_method", "VARCHAR(64) NULL");

        schemaSupport.jdbcTemplate().execute(
                "UPDATE orders " +
                        "SET order_status = CASE CAST(order_status AS CHAR) " +
                        "WHEN '0' THEN 'PENDING' " +
                        "WHEN '1' THEN 'PLACED' " +
                        "WHEN '2' THEN 'CONFIRMED' " +
                        "WHEN '3' THEN 'SHIPPED' " +
                        "WHEN '4' THEN 'OUT_FOR_DELIVERY' " +
                        "WHEN '5' THEN 'DELIVERED' " +
                        "WHEN '6' THEN 'CANCELLED' " +
                        "WHEN 'COMPLETE' THEN 'DELIVERED' " +
                        "WHEN 'COMPLETED' THEN 'DELIVERED' " +
                        "WHEN 'PAYMENT_PENDING' THEN 'INITIATED' " +
                        "ELSE order_status END"
        );

        schemaSupport.jdbcTemplate().execute(
                "UPDATE orders " +
                        "SET payment_status = CASE CAST(payment_status AS CHAR) " +
                        "WHEN '0' THEN 'PENDING' " +
                        "WHEN '1' THEN 'PROCESSING' " +
                        "WHEN '2' THEN 'SUCCESS' " +
                        "WHEN '3' THEN 'FAILED' " +
                        "WHEN 'CAPTURED' THEN 'SUCCESS' " +
                        "WHEN 'PAID' THEN 'SUCCESS' " +
                        "WHEN 'COMPLETED' THEN 'SUCCESS' " +
                        "WHEN 'CREATED' THEN 'PENDING' " +
                        "ELSE payment_status END"
        );

        schemaSupport.jdbcTemplate().execute(
                "UPDATE orders " +
                        "SET status = CASE CAST(status AS CHAR) " +
                        "WHEN '0' THEN 'PENDING' " +
                        "WHEN '1' THEN 'PROCESSING' " +
                        "WHEN '2' THEN 'SUCCESS' " +
                        "WHEN '3' THEN 'FAILED' " +
                        "WHEN 'CAPTURED' THEN 'SUCCESS' " +
                        "WHEN 'PAID' THEN 'SUCCESS' " +
                        "WHEN 'COMPLETED' THEN 'SUCCESS' " +
                        "WHEN 'CREATED' THEN 'PENDING' " +
                        "ELSE status END"
        );

        schemaSupport.jdbcTemplate().execute(
                "UPDATE payment_order " +
                        "SET status = CASE CAST(status AS CHAR) " +
                        "WHEN '0' THEN 'PENDING' " +
                        "WHEN '1' THEN 'SUCCESS' " +
                        "WHEN '2' THEN 'FAILED' " +
                        "WHEN 'CAPTURED' THEN 'SUCCESS' " +
                        "WHEN 'PAID' THEN 'SUCCESS' " +
                        "WHEN 'COMPLETED' THEN 'SUCCESS' " +
                        "WHEN 'CREATED' THEN 'PENDING' " +
                        "ELSE status END"
        );

        schemaSupport.jdbcTemplate().execute(
                "UPDATE payment_order " +
                        "SET payment_method = CASE CAST(payment_method AS CHAR) " +
                        "WHEN '0' THEN 'RAZORPAY' " +
                        "WHEN '1' THEN 'STRIPE' " +
                        "WHEN 'CARD' THEN 'STRIPE' " +
                        "WHEN 'ONLINE' THEN 'RAZORPAY' " +
                        "ELSE payment_method END"
        );
    }

    void ensureCheckoutPaymentColumns() {
        schemaSupport.ensureColumn("orders", "payment_method", "VARCHAR(64) NULL");
        schemaSupport.ensureColumn("orders", "payment_type", "VARCHAR(64) NULL");
        schemaSupport.ensureColumn("orders", "provider", "VARCHAR(64) NULL");

        schemaSupport.ensureColumn("payment_order", "payment_type", "VARCHAR(64) NULL");
        schemaSupport.ensureColumn("payment_order", "provider", "VARCHAR(64) NULL");
        schemaSupport.ensureColumn("payment_order", "merchant_transaction_id", "VARCHAR(128) NULL");
        schemaSupport.ensureColumn("payment_order", "checkout_request_id", "VARCHAR(128) NULL");
        schemaSupport.ensureColumn("payment_order", "retry_count", "INT NOT NULL DEFAULT 0");
        schemaSupport.ensureColumn("payment_order", "last_retry_at", "DATETIME(6) NULL");
        schemaSupport.ensureColumn("payment_order", "coupon_reservation_state", "VARCHAR(32) NULL");
        schemaSupport.ensureUniqueIndex("payment_order", "uk_payment_order_user_checkout", "user_id, checkout_request_id");

        schemaSupport.jdbcTemplate().execute(
                "UPDATE payment_order " +
                        "SET payment_method = CASE CAST(payment_method AS CHAR) " +
                        "WHEN 'RAZORPAY' THEN 'UPI' " +
                        "WHEN 'PHONEPE' THEN 'UPI' " +
                        "WHEN 'ONLINE' THEN 'UPI' " +
                        "WHEN 'STRIPE' THEN 'CARD' " +
                        "ELSE payment_method END"
        );

        schemaSupport.jdbcTemplate().execute(
                "UPDATE payment_order " +
                        "SET payment_type = CASE CAST(payment_method AS CHAR) " +
                        "WHEN 'COD' THEN 'CASH' " +
                        "WHEN 'UPI' THEN 'UPI' " +
                        "WHEN 'CARD' THEN 'CARD' " +
                        "ELSE payment_type END " +
                        "WHERE payment_type IS NULL"
        );

        schemaSupport.jdbcTemplate().execute(
                "UPDATE payment_order " +
                        "SET provider = CASE " +
                        "WHEN provider IS NOT NULL AND provider <> '' THEN provider " +
                        "WHEN payment_method = 'UPI' THEN 'PHONEPE' " +
                        "WHEN payment_method = 'CARD' THEN 'STRIPE' " +
                        "ELSE provider END"
        );

        schemaSupport.jdbcTemplate().execute(
                "UPDATE payment_order " +
                        "SET merchant_transaction_id = payment_link_id " +
                        "WHERE merchant_transaction_id IS NULL " +
                        "AND payment_link_id IS NOT NULL " +
                        "AND payment_link_id <> ''"
        );

        schemaSupport.jdbcTemplate().execute(
                "UPDATE payment_order " +
                        "SET coupon_reservation_state = 'NONE' " +
                        "WHERE coupon_reservation_state IS NULL " +
                        "OR TRIM(CAST(coupon_reservation_state AS CHAR)) = ''"
        );
    }

    void ensureCouponColumns() {
        schemaSupport.ensureColumn("coupon", "discount_type", "VARCHAR(32) NULL");
        schemaSupport.ensureColumn("coupon", "discount_value", "DOUBLE NULL");
        schemaSupport.ensureColumn("coupon", "max_discount", "DOUBLE NULL");
        schemaSupport.ensureColumn("coupon", "usage_limit", "INT NULL");
        schemaSupport.ensureColumn("coupon", "per_user_limit", "INT NULL");
        schemaSupport.ensureColumn("coupon", "used_count", "INT NOT NULL DEFAULT 0");
        schemaSupport.ensureColumn("coupon", "reserved_count", "INT NOT NULL DEFAULT 0");
        schemaSupport.ensureColumn("coupon", "scope_type", "VARCHAR(32) NULL");
        schemaSupport.ensureColumn("coupon", "scope_id", "BIGINT NULL");
        schemaSupport.ensureColumn("coupon", "first_order_only", "BOOLEAN NOT NULL DEFAULT FALSE");
        schemaSupport.ensureColumn("coupon", "user_eligibility_type", "VARCHAR(64) NULL");
        schemaSupport.ensureColumn("coupon", "inactive_days_threshold", "INT NULL");
        schemaSupport.ensureColumn("coupon", "is_active", "BOOLEAN NOT NULL DEFAULT TRUE");
        schemaSupport.ensureColumn("cart", "coupon_discount_amount", "DOUBLE NULL");
        schemaSupport.ensureColumn("orders", "coupon_code", "VARCHAR(255) NULL");

        schemaSupport.jdbcTemplate().execute(
                "UPDATE coupon " +
                        "SET discount_type = 'PERCENT' " +
                        "WHERE discount_type IS NULL " +
                        "OR " + schemaSupport.emptyEnumAsTextCondition("discount_type")
        );

        schemaSupport.jdbcTemplate().execute(
                "UPDATE coupon " +
                        "SET discount_value = CASE " +
                        "WHEN discount_value IS NULL OR discount_value = 0 THEN discount_percentage " +
                        "ELSE discount_value END"
        );

        schemaSupport.jdbcTemplate().execute(
                "UPDATE coupon " +
                        "SET per_user_limit = CASE " +
                        "WHEN per_user_limit IS NULL OR per_user_limit < 1 THEN 1 " +
                        "ELSE per_user_limit END"
        );

        schemaSupport.jdbcTemplate().execute(
                "UPDATE coupon " +
                        "SET used_count = CASE " +
                        "WHEN used_count IS NULL OR used_count < 0 THEN 0 " +
                        "ELSE used_count END"
        );

        schemaSupport.jdbcTemplate().execute(
                "UPDATE coupon " +
                        "SET reserved_count = CASE " +
                        "WHEN reserved_count IS NULL OR reserved_count < 0 THEN 0 " +
                        "ELSE reserved_count END"
        );

        schemaSupport.jdbcTemplate().execute(
                "UPDATE coupon " +
                        "SET scope_type = 'GLOBAL' " +
                        "WHERE scope_type IS NULL OR " + schemaSupport.emptyEnumAsTextCondition("scope_type")
        );

        schemaSupport.jdbcTemplate().execute(
                "UPDATE coupon " +
                        "SET first_order_only = FALSE " +
                        "WHERE first_order_only IS NULL"
        );

        schemaSupport.jdbcTemplate().execute(
                "UPDATE coupon " +
                        "SET user_eligibility_type = CASE " +
                        "WHEN first_order_only = TRUE THEN 'NEW_USERS_ONLY' " +
                        "ELSE 'ALL_USERS' END " +
                        "WHERE user_eligibility_type IS NULL OR " + schemaSupport.emptyEnumAsTextCondition("user_eligibility_type")
        );

        schemaSupport.jdbcTemplate().execute(
                "UPDATE coupon " +
                        "SET inactive_days_threshold = CASE " +
                        "WHEN user_eligibility_type = 'INACTIVE_USERS_ONLY' " +
                        "AND (inactive_days_threshold IS NULL OR inactive_days_threshold < 1) THEN 30 " +
                        "WHEN user_eligibility_type <> 'INACTIVE_USERS_ONLY' THEN NULL " +
                        "ELSE inactive_days_threshold END"
        );

        ensureCouponUsageTable();
        ensureCouponUserMapTable();
        ensureCouponEventLogTable();
    }

    private void ensureCouponUsageTable() {
        if (schemaSupport.tableExists("coupon_usage")) {
            schemaSupport.ensureColumn("coupon_usage", "order_id", "BIGINT NULL");
            schemaSupport.ensureColumn("coupon_usage", "coupon_code", "VARCHAR(255) NULL");
            schemaSupport.ensureColumn("coupon_usage", "discount_amount", "DOUBLE NULL");
            schemaSupport.ensureColumn("coupon_usage", "used_at", "TIMESTAMP NULL");
            return;
        }

        schemaSupport.jdbcTemplate().execute(
                "CREATE TABLE coupon_usage (" +
                        "id BIGINT NOT NULL AUTO_INCREMENT," +
                        "coupon_id BIGINT NULL," +
                        "user_id BIGINT NULL," +
                        "order_id BIGINT NULL," +
                        "coupon_code VARCHAR(255) NULL," +
                        "discount_amount DOUBLE NULL," +
                        "used_at TIMESTAMP NULL," +
                        "PRIMARY KEY (id)" +
                        ")"
        );
    }

    private void ensureCouponUserMapTable() {
        if (schemaSupport.tableExists("coupon_user_map")) {
            schemaSupport.ensureColumn("coupon_user_map", "coupon_id", "BIGINT NOT NULL");
            schemaSupport.ensureColumn("coupon_user_map", "user_id", "BIGINT NOT NULL");
            schemaSupport.ensureColumn("coupon_user_map", "created_at", "DATETIME(6) NOT NULL");
            return;
        }

        schemaSupport.jdbcTemplate().execute(
                "CREATE TABLE coupon_user_map (" +
                        "id BIGINT NOT NULL AUTO_INCREMENT," +
                        "coupon_id BIGINT NOT NULL," +
                        "user_id BIGINT NOT NULL," +
                        "created_at DATETIME(6) NOT NULL," +
                        "PRIMARY KEY (id)," +
                        "UNIQUE KEY uk_coupon_user_map_coupon_user (coupon_id, user_id)" +
                        ")"
        );
    }

    private void ensureCouponEventLogTable() {
        if (schemaSupport.tableExists("coupon_event_log")) {
            schemaSupport.ensureColumn("coupon_event_log", "coupon_id", "BIGINT NULL");
            schemaSupport.ensureColumn("coupon_event_log", "coupon_code", "VARCHAR(255) NULL");
            schemaSupport.ensureColumn("coupon_event_log", "user_id", "BIGINT NULL");
            schemaSupport.ensureColumn("coupon_event_log", "event_type", "VARCHAR(64) NOT NULL");
            schemaSupport.ensureColumn("coupon_event_log", "reason_code", "VARCHAR(128) NULL");
            schemaSupport.ensureColumn("coupon_event_log", "note", "VARCHAR(1200) NULL");
            schemaSupport.ensureColumn("coupon_event_log", "created_at", "DATETIME(6) NOT NULL");
            return;
        }

        schemaSupport.jdbcTemplate().execute(
                "CREATE TABLE coupon_event_log (" +
                        "id BIGINT NOT NULL AUTO_INCREMENT," +
                        "coupon_id BIGINT NULL," +
                        "coupon_code VARCHAR(255) NULL," +
                        "user_id BIGINT NULL," +
                        "event_type VARCHAR(64) NOT NULL," +
                        "reason_code VARCHAR(128) NULL," +
                        "note VARCHAR(1200) NULL," +
                        "created_at DATETIME(6) NOT NULL," +
                        "PRIMARY KEY (id)," +
                        "INDEX idx_coupon_event_log_created_at (created_at)," +
                        "INDEX idx_coupon_event_log_coupon_id (coupon_id)," +
                        "INDEX idx_coupon_event_log_user_id (user_id)" +
                        ")"
        );
    }
}
