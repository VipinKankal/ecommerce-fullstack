package com.example.ecommerce.common.configuration;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class InventorySchemaCompatibilityInitializer implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(ApplicationArguments args) {
        ensureLegacyStatusColumnsCompatible();
        ensureCheckoutPaymentColumns();
        ensureProductInventoryColumns();
        ensureProductVariantTable();
        ensureProductWarehouseOpsColumns();
        ensureProductActivationColumn();
        ensureProductWarrantyColumns();
        ensureDeliveredAtColumn();
        ensureInventoryMovementTable();
        ensureRestockNotificationTables();
        ensureOrderReturnExchangeTables();
        ensureWarehouseTransferRequestTable();
        ensureAuditLogTable();
    }

    private void ensureLegacyStatusColumnsCompatible() {
        ensureColumnType("orders", "order_status", "VARCHAR(64) NULL");
        ensureColumnType("orders", "payment_status", "VARCHAR(64) NULL");
        ensureColumnType("orders", "status", "VARCHAR(64) NULL");
        ensureColumnType("payment_order", "status", "VARCHAR(64) NULL");
        ensureColumnType("payment_order", "payment_method", "VARCHAR(64) NULL");

        jdbcTemplate.execute(
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

        jdbcTemplate.execute(
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

        jdbcTemplate.execute(
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

        jdbcTemplate.execute(
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

        jdbcTemplate.execute(
                "UPDATE payment_order " +
                        "SET payment_method = CASE CAST(payment_method AS CHAR) " +
                        "WHEN '0' THEN 'RAZORPAY' " +
                        "WHEN '1' THEN 'STRIPE' " +
                        "WHEN 'CARD' THEN 'STRIPE' " +
                        "WHEN 'ONLINE' THEN 'RAZORPAY' " +
                        "ELSE payment_method END"
        );
    }

    private void ensureCheckoutPaymentColumns() {
        ensureColumn("orders", "payment_method", "VARCHAR(64) NULL");
        ensureColumn("orders", "payment_type", "VARCHAR(64) NULL");
        ensureColumn("orders", "provider", "VARCHAR(64) NULL");

        ensureColumn("payment_order", "payment_type", "VARCHAR(64) NULL");
        ensureColumn("payment_order", "provider", "VARCHAR(64) NULL");
        ensureColumn("payment_order", "merchant_transaction_id", "VARCHAR(128) NULL");

        jdbcTemplate.execute(
                "UPDATE payment_order " +
                        "SET payment_method = CASE CAST(payment_method AS CHAR) " +
                        "WHEN 'RAZORPAY' THEN 'UPI' " +
                        "WHEN 'PHONEPE' THEN 'UPI' " +
                        "WHEN 'ONLINE' THEN 'UPI' " +
                        "WHEN 'STRIPE' THEN 'CARD' " +
                        "ELSE payment_method END"
        );

        jdbcTemplate.execute(
                "UPDATE payment_order " +
                        "SET payment_type = CASE CAST(payment_method AS CHAR) " +
                        "WHEN 'COD' THEN 'CASH' " +
                        "WHEN 'UPI' THEN 'UPI' " +
                        "WHEN 'CARD' THEN 'CARD' " +
                        "ELSE payment_type END " +
                        "WHERE payment_type IS NULL"
        );

        jdbcTemplate.execute(
                "UPDATE payment_order " +
                        "SET provider = CASE " +
                        "WHEN provider IS NOT NULL AND provider <> '' THEN provider " +
                        "WHEN payment_method = 'UPI' THEN 'PHONEPE' " +
                        "WHEN payment_method = 'CARD' THEN 'STRIPE' " +
                        "ELSE provider END"
        );

        jdbcTemplate.execute(
                "UPDATE payment_order " +
                        "SET merchant_transaction_id = payment_link_id " +
                        "WHERE merchant_transaction_id IS NULL " +
                        "AND payment_link_id IS NOT NULL " +
                        "AND payment_link_id <> ''"
        );
    }

    private void ensureProductInventoryColumns() {
        ensureColumn("product", "seller_stock", "INT NOT NULL DEFAULT 0");
        ensureColumn("product", "warehouse_stock", "INT NOT NULL DEFAULT 0");

        jdbcTemplate.execute(
                "UPDATE product " +
                        "SET warehouse_stock = CASE " +
                        "WHEN warehouse_stock IS NULL OR warehouse_stock = 0 THEN quantity " +
                        "ELSE warehouse_stock END, " +
                        "seller_stock = CASE WHEN seller_stock IS NULL THEN 0 ELSE seller_stock END"
        );
    }

    private void ensureProductVariantTable() {
        jdbcTemplate.execute(
                "CREATE TABLE IF NOT EXISTS product_variants (" +
                        "id BIGINT NOT NULL AUTO_INCREMENT," +
                        "product_id BIGINT NULL," +
                        "variant_type VARCHAR(255) NULL," +
                        "variant_value VARCHAR(255) NULL," +
                        "size VARCHAR(255) NULL," +
                        "color VARCHAR(255) NULL," +
                        "sku VARCHAR(255) NULL," +
                        "price INT NULL," +
                        "seller_stock INT NULL," +
                        "warehouse_stock INT NULL," +
                        "PRIMARY KEY (id)," +
                        "CONSTRAINT fk_product_variant_product FOREIGN KEY (product_id) REFERENCES product (id)" +
                        ")"
        );
    }

    private void ensureProductWarehouseOpsColumns() {
        ensureColumn("product", "low_stock_threshold", "INT NOT NULL DEFAULT 10");
        ensureColumn("warehouse_transfer_requests", "pickup_proof_url", "VARCHAR(1200) NULL");
        ensureColumn("warehouse_transfer_requests", "receive_proof_url", "VARCHAR(1200) NULL");
        ensureColumn("order_return_exchange_requests", "qc_result", "VARCHAR(255) NULL");
        ensureColumn("order_return_exchange_requests", "warehouse_proof_url", "VARCHAR(1200) NULL");
        jdbcTemplate.execute(
                "UPDATE product SET low_stock_threshold = CASE " +
                        "WHEN low_stock_threshold IS NULL OR low_stock_threshold < 0 THEN 10 " +
                        "ELSE low_stock_threshold END"
        );
    }

    private void ensureProductActivationColumn() {
        ensureColumn("product", "is_active", "BIT NOT NULL DEFAULT b'1'");
        jdbcTemplate.execute(
                "UPDATE product " +
                        "SET is_active = b'1' " +
                        "WHERE is_active IS NULL"
        );
    }

    private void ensureProductWarrantyColumns() {
        ensureColumn("product", "warranty_type", "VARCHAR(32) NULL");
        ensureColumn("product", "warranty_days", "INT NOT NULL DEFAULT 0");

        jdbcTemplate.execute(
                "UPDATE product " +
                        "SET warranty_type = CASE " +
                        "WHEN warranty_type IS NULL OR warranty_type = '' THEN 'NONE' " +
                        "WHEN UPPER(warranty_type) = 'MANUFACTURER' THEN 'BRAND' " +
                        "ELSE UPPER(warranty_type) END, " +
                        "warranty_days = CASE WHEN warranty_days IS NULL THEN 0 ELSE warranty_days END"
        );
    }

    private void ensureDeliveredAtColumn() {
        ensureColumn("orders", "delivered_at", "DATETIME(6) NULL");
        ensureColumn("orders", "shipped_at", "DATETIME(6) NULL");

        jdbcTemplate.execute(
                "UPDATE orders " +
                "SET delivered_at = delivery_date " +
                        "WHERE delivered_at IS NULL " +
                        "AND order_status = 'DELIVERED' " +
                        "AND delivery_date IS NOT NULL"
        );
        jdbcTemplate.execute(
                "UPDATE orders " +
                        "SET shipped_at = order_date " +
                        "WHERE shipped_at IS NULL " +
                        "AND order_status = 'SHIPPED' " +
                        "AND order_date IS NOT NULL"
        );
    }

    private void ensureInventoryMovementTable() {
        jdbcTemplate.execute(
                "CREATE TABLE IF NOT EXISTS inventory_movements (" +
                        "id BIGINT NOT NULL AUTO_INCREMENT," +
                        "product_id BIGINT NULL," +
                        "order_item_id BIGINT NULL," +
                        "request_id BIGINT NULL," +
                        "request_type VARCHAR(255) NULL," +
                        "action VARCHAR(255) NULL," +
                        "from_location VARCHAR(255) NULL," +
                        "to_location VARCHAR(255) NULL," +
                        "quantity INT NULL," +
                        "movement_type VARCHAR(255) NULL," +
                        "order_status VARCHAR(255) NULL," +
                        "added_by VARCHAR(255) NULL," +
                        "updated_by VARCHAR(255) NULL," +
                        "note VARCHAR(1200) NULL," +
                        "created_at DATETIME(6) NULL," +
                        "PRIMARY KEY (id)," +
                        "CONSTRAINT fk_inventory_movement_product FOREIGN KEY (product_id) REFERENCES product (id)" +
                        ")"
        );
    }

    private void ensureRestockNotificationTables() {
        jdbcTemplate.execute(
                "CREATE TABLE IF NOT EXISTS product_restock_subscriptions (" +
                        "id BIGINT NOT NULL AUTO_INCREMENT," +
                        "product_id BIGINT NULL," +
                        "user_id BIGINT NULL," +
                        "status VARCHAR(64) NOT NULL," +
                        "created_at DATETIME(6) NOT NULL," +
                        "notified_at DATETIME(6) NULL," +
                        "converted_at DATETIME(6) NULL," +
                        "PRIMARY KEY (id)," +
                        "CONSTRAINT fk_restock_subscription_product FOREIGN KEY (product_id) REFERENCES product (id)," +
                        "CONSTRAINT fk_restock_subscription_user FOREIGN KEY (user_id) REFERENCES user (id)" +
                        ")"
        );

        jdbcTemplate.execute(
                "CREATE TABLE IF NOT EXISTS product_restock_notification_logs (" +
                        "id BIGINT NOT NULL AUTO_INCREMENT," +
                        "subscription_id BIGINT NULL," +
                        "product_id BIGINT NULL," +
                        "user_id BIGINT NULL," +
                        "status VARCHAR(64) NOT NULL," +
                        "note VARCHAR(1200) NULL," +
                        "created_at DATETIME(6) NOT NULL," +
                        "PRIMARY KEY (id)," +
                        "CONSTRAINT fk_restock_log_subscription FOREIGN KEY (subscription_id) REFERENCES product_restock_subscriptions (id)," +
                        "CONSTRAINT fk_restock_log_product FOREIGN KEY (product_id) REFERENCES product (id)," +
                        "CONSTRAINT fk_restock_log_user FOREIGN KEY (user_id) REFERENCES user (id)" +
                        ")"
        );
    }

    private void ensureOrderReturnExchangeTables() {
        jdbcTemplate.execute(
                "CREATE TABLE IF NOT EXISTS order_return_exchange_requests (" +
                        "id BIGINT NOT NULL AUTO_INCREMENT," +
                        "request_number VARCHAR(255) NULL," +
                        "request_type VARCHAR(255) NULL," +
                        "status VARCHAR(255) NULL," +
                        "order_id BIGINT NULL," +
                        "order_item_id BIGINT NULL," +
                        "customer_id BIGINT NULL," +
                        "customer_name VARCHAR(255) NULL," +
                        "seller_id BIGINT NULL," +
                        "product_id BIGINT NULL," +
                        "product_title VARCHAR(255) NULL," +
                        "product_image VARCHAR(255) NULL," +
                        "quantity_requested INT NULL," +
                        "reason_code VARCHAR(255) NULL," +
                        "customer_comment VARCHAR(2000) NULL," +
                        "admin_comment VARCHAR(1200) NULL," +
                        "rejection_reason VARCHAR(1200) NULL," +
                        "courier_id BIGINT NULL," +
                        "courier_name VARCHAR(255) NULL," +
                        "requested_new_product_id BIGINT NULL," +
                        "requested_new_product_title VARCHAR(255) NULL," +
                        "requested_new_product_image VARCHAR(255) NULL," +
                        "requested_variant VARCHAR(255) NULL," +
                        "product_photo VARCHAR(1200) NULL," +
                        "qc_result VARCHAR(255) NULL," +
                        "warehouse_proof_url VARCHAR(1200) NULL," +
                        "old_price INT NULL," +
                        "new_price INT NULL," +
                        "price_difference INT NULL," +
                        "balance_mode VARCHAR(255) NULL," +
                        "payment_reference VARCHAR(255) NULL," +
                        "refund_status VARCHAR(255) NULL," +
                        "refund_eligible_after DATETIME(6) NULL," +
                        "wallet_credit_status VARCHAR(255) NULL," +
                        "bank_refund_status VARCHAR(255) NULL," +
                        "bank_account_holder_name VARCHAR(255) NULL," +
                        "bank_account_number VARCHAR(255) NULL," +
                        "bank_ifsc_code VARCHAR(255) NULL," +
                        "bank_name VARCHAR(255) NULL," +
                        "bank_upi_id VARCHAR(255) NULL," +
                        "replacement_order_id BIGINT NULL," +
                        "requested_at DATETIME(6) NULL," +
                        "approved_at DATETIME(6) NULL," +
                        "admin_reviewed_at DATETIME(6) NULL," +
                        "pickup_scheduled_at DATETIME(6) NULL," +
                        "pickup_completed_at DATETIME(6) NULL," +
                        "received_at DATETIME(6) NULL," +
                        "refund_initiated_at DATETIME(6) NULL," +
                        "refund_completed_at DATETIME(6) NULL," +
                        "payment_completed_at DATETIME(6) NULL," +
                        "wallet_credit_completed_at DATETIME(6) NULL," +
                        "bank_refund_initiated_at DATETIME(6) NULL," +
                        "bank_refund_completed_at DATETIME(6) NULL," +
                        "replacement_created_at DATETIME(6) NULL," +
                        "replacement_shipped_at DATETIME(6) NULL," +
                        "replacement_proof_url VARCHAR(1200) NULL," +
                        "replacement_delivered_at DATETIME(6) NULL," +
                        "completed_at DATETIME(6) NULL," +
                        "PRIMARY KEY (id)," +
                        "CONSTRAINT uk_order_return_exchange_request_number UNIQUE (request_number)" +
                        ")"
        );

        jdbcTemplate.execute(
                "CREATE TABLE IF NOT EXISTS order_return_exchange_request_history (" +
                        "request_id BIGINT NOT NULL," +
                        "history_index INT NOT NULL," +
                        "status VARCHAR(255) NULL," +
                        "note VARCHAR(1200) NULL," +
                        "updated_by VARCHAR(255) NULL," +
                        "created_at DATETIME(6) NULL," +
                        "PRIMARY KEY (request_id, history_index)," +
                        "CONSTRAINT fk_order_return_exchange_request_history_request " +
                        "FOREIGN KEY (request_id) REFERENCES order_return_exchange_requests (id)" +
                        ")"
        );
        ensureColumn("order_return_exchange_requests", "replacement_proof_url", "VARCHAR(1200) NULL");
    }

    private void ensureWarehouseTransferRequestTable() {
        jdbcTemplate.execute(
                "CREATE TABLE IF NOT EXISTS warehouse_transfer_requests (" +
                        "id BIGINT NOT NULL AUTO_INCREMENT," +
                        "product_id BIGINT NULL," +
                        "seller_id BIGINT NULL," +
                        "quantity INT NOT NULL," +
                        "status VARCHAR(64) NOT NULL," +
                        "seller_note VARCHAR(1200) NULL," +
                        "admin_note VARCHAR(1200) NULL," +
                        "rejection_reason VARCHAR(1200) NULL," +
                        "pickup_proof_url VARCHAR(1200) NULL," +
                        "receive_proof_url VARCHAR(1200) NULL," +
                        "pickup_mode VARCHAR(64) NULL," +
                        "estimated_weight_kg DOUBLE NULL," +
                        "package_count INT NULL," +
                        "preferred_vehicle VARCHAR(64) NULL," +
                        "suggested_vehicle VARCHAR(64) NULL," +
                        "estimated_pickup_hours INT NULL," +
                        "estimated_logistics_charge INT NULL," +
                        "package_type VARCHAR(64) NULL," +
                        "pickup_ready_at DATETIME(6) NULL," +
                        "pickup_address_verified BIT NULL," +
                        "transport_mode VARCHAR(64) NULL," +
                        "assigned_courier_name VARCHAR(255) NULL," +
                        "transporter_name VARCHAR(255) NULL," +
                        "invoice_number VARCHAR(255) NULL," +
                        "challan_number VARCHAR(255) NULL," +
                        "requested_at DATETIME(6) NOT NULL," +
                        "approved_at DATETIME(6) NULL," +
                        "picked_up_at DATETIME(6) NULL," +
                        "received_at DATETIME(6) NULL," +
                        "cancelled_at DATETIME(6) NULL," +
                        "PRIMARY KEY (id)," +
                        "CONSTRAINT fk_warehouse_transfer_product FOREIGN KEY (product_id) REFERENCES product (id)," +
                        "CONSTRAINT fk_warehouse_transfer_seller FOREIGN KEY (seller_id) REFERENCES seller (id)" +
                        ")"
        );
        ensureColumn("warehouse_transfer_requests", "pickup_mode", "VARCHAR(64) NULL");
        ensureColumn("warehouse_transfer_requests", "estimated_weight_kg", "DOUBLE NULL");
        ensureColumn("warehouse_transfer_requests", "package_count", "INT NULL");
        ensureColumn("warehouse_transfer_requests", "preferred_vehicle", "VARCHAR(64) NULL");
        ensureColumn("warehouse_transfer_requests", "suggested_vehicle", "VARCHAR(64) NULL");
        ensureColumn("warehouse_transfer_requests", "estimated_pickup_hours", "INT NULL");
        ensureColumn("warehouse_transfer_requests", "estimated_logistics_charge", "INT NULL");
        ensureColumn("warehouse_transfer_requests", "package_type", "VARCHAR(64) NULL");
        ensureColumn("warehouse_transfer_requests", "pickup_ready_at", "DATETIME(6) NULL");
        ensureColumn("warehouse_transfer_requests", "pickup_address_verified", "BIT NULL");
        ensureColumn("warehouse_transfer_requests", "transport_mode", "VARCHAR(64) NULL");
        ensureColumn("warehouse_transfer_requests", "assigned_courier_name", "VARCHAR(255) NULL");
        ensureColumn("warehouse_transfer_requests", "transporter_name", "VARCHAR(255) NULL");
        ensureColumn("warehouse_transfer_requests", "invoice_number", "VARCHAR(255) NULL");
        ensureColumn("warehouse_transfer_requests", "challan_number", "VARCHAR(255) NULL");
    }

    private void ensureAuditLogTable() {
        jdbcTemplate.execute(
                "CREATE TABLE IF NOT EXISTS audit_log_entries (" +
                        "id BIGINT NOT NULL AUTO_INCREMENT," +
                        "method VARCHAR(16) NOT NULL," +
                        "path VARCHAR(255) NOT NULL," +
                        "status INT NOT NULL," +
                        "actor VARCHAR(255) NOT NULL," +
                        "ip_address VARCHAR(64) NULL," +
                        "duration_ms BIGINT NOT NULL," +
                        "created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP," +
                        "PRIMARY KEY (id)," +
                        "INDEX idx_audit_log_entries_created_at (created_at)," +
                        "INDEX idx_audit_log_entries_actor (actor)," +
                        "INDEX idx_audit_log_entries_path (path)" +
                        ")"
        );
    }

    private boolean columnExists(String tableName, String columnName) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM information_schema.columns " +
                        "WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?",
                Integer.class,
                tableName,
                columnName
        );
        return count != null && count > 0;
    }

    private void ensureColumnType(String tableName, String columnName, String columnDefinition) {
        if (columnExists(tableName, columnName)) {
            jdbcTemplate.execute(
                    "ALTER TABLE " + tableName + " MODIFY COLUMN " + columnName + " " + columnDefinition
            );
        }
    }

    private void ensureColumn(String tableName, String columnName, String columnDefinition) {
        if (!columnExists(tableName, columnName)) {
            jdbcTemplate.execute(
                    "ALTER TABLE " + tableName + " ADD COLUMN " + columnName + " " + columnDefinition
            );
            log.info("Added missing column {}.{}", tableName, columnName);
        }
    }
}
