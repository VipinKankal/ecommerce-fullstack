ALTER TABLE warehouse_transfer_requests
    ADD COLUMN pickup_mode VARCHAR(64) NULL,
    ADD COLUMN estimated_weight_kg DOUBLE NULL,
    ADD COLUMN package_count INT NULL,
    ADD COLUMN preferred_vehicle VARCHAR(64) NULL,
    ADD COLUMN suggested_vehicle VARCHAR(64) NULL,
    ADD COLUMN estimated_pickup_hours INT NULL,
    ADD COLUMN estimated_logistics_charge INT NULL;

UPDATE warehouse_transfer_requests
SET pickup_mode = COALESCE(pickup_mode, 'WAREHOUSE_PICKUP'),
    estimated_weight_kg = COALESCE(estimated_weight_kg, 5),
    package_count = COALESCE(package_count, 1),
    preferred_vehicle = COALESCE(preferred_vehicle, 'AUTO'),
    suggested_vehicle = COALESCE(suggested_vehicle, preferred_vehicle, 'AUTO'),
    estimated_pickup_hours = COALESCE(estimated_pickup_hours, 10),
    estimated_logistics_charge = COALESCE(estimated_logistics_charge, 110);

