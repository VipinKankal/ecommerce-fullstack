package com.example.ecommerce.common.configuration;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class InventorySchemaCompatibilityInitializer implements ApplicationRunner {

    private final InventorySchemaCommerceSupport commerceSupport;
    private final InventorySchemaWarehouseSupport warehouseSupport;

    public InventorySchemaCompatibilityInitializer(JdbcTemplate jdbcTemplate) {
        InventorySchemaSupport schemaSupport = new InventorySchemaSupport(jdbcTemplate);
        this.commerceSupport = new InventorySchemaCommerceSupport(schemaSupport);
        this.warehouseSupport = new InventorySchemaWarehouseSupport(schemaSupport);
    }

    @Override
    public void run(ApplicationArguments args) {
        commerceSupport.ensureLegacyStatusColumnsCompatible();
        commerceSupport.ensureCheckoutPaymentColumns();
        commerceSupport.ensureCouponColumns();
        warehouseSupport.ensureProductInventoryColumns();
        warehouseSupport.ensureProductVariantTable();
        warehouseSupport.ensureProductWarehouseOpsColumns();
        warehouseSupport.ensureProductActivationColumn();
        warehouseSupport.ensureProductWarrantyColumns();
        warehouseSupport.ensureDeliveredAtColumn();
        warehouseSupport.ensureInventoryMovementTable();
        warehouseSupport.ensureRestockNotificationTables();
        warehouseSupport.ensureOrderReturnExchangeTables();
        warehouseSupport.ensureWarehouseTransferRequestTable();
    }
}
