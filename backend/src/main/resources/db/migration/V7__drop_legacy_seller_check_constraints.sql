SET @schema_name = DATABASE();

-- Drop legacy seller_chk_* constraints if present (older schema variants)
SELECT COUNT(*) INTO @c1 FROM information_schema.table_constraints WHERE constraint_schema=@schema_name AND table_name='seller' AND constraint_name='seller_chk_1' AND constraint_type='CHECK';
SET @s1 = IF(@c1 > 0, 'ALTER TABLE seller DROP CHECK seller_chk_1', 'SELECT 1');
PREPARE st1 FROM @s1; EXECUTE st1; DEALLOCATE PREPARE st1;

SELECT COUNT(*) INTO @c2 FROM information_schema.table_constraints WHERE constraint_schema=@schema_name AND table_name='seller' AND constraint_name='seller_chk_2' AND constraint_type='CHECK';
SET @s2 = IF(@c2 > 0, 'ALTER TABLE seller DROP CHECK seller_chk_2', 'SELECT 1');
PREPARE st2 FROM @s2; EXECUTE st2; DEALLOCATE PREPARE st2;

SELECT COUNT(*) INTO @c3 FROM information_schema.table_constraints WHERE constraint_schema=@schema_name AND table_name='seller' AND constraint_name='seller_chk_3' AND constraint_type='CHECK';
SET @s3 = IF(@c3 > 0, 'ALTER TABLE seller DROP CHECK seller_chk_3', 'SELECT 1');
PREPARE st3 FROM @s3; EXECUTE st3; DEALLOCATE PREPARE st3;

SELECT COUNT(*) INTO @c4 FROM information_schema.table_constraints WHERE constraint_schema=@schema_name AND table_name='seller' AND constraint_name='seller_chk_4' AND constraint_type='CHECK';
SET @s4 = IF(@c4 > 0, 'ALTER TABLE seller DROP CHECK seller_chk_4', 'SELECT 1');
PREPARE st4 FROM @s4; EXECUTE st4; DEALLOCATE PREPARE st4;

SELECT COUNT(*) INTO @c5 FROM information_schema.table_constraints WHERE constraint_schema=@schema_name AND table_name='seller' AND constraint_name='seller_chk_5' AND constraint_type='CHECK';
SET @s5 = IF(@c5 > 0, 'ALTER TABLE seller DROP CHECK seller_chk_5', 'SELECT 1');
PREPARE st5 FROM @s5; EXECUTE st5; DEALLOCATE PREPARE st5;

SELECT COUNT(*) INTO @c6 FROM information_schema.table_constraints WHERE constraint_schema=@schema_name AND table_name='seller' AND constraint_name='seller_chk_6' AND constraint_type='CHECK';
SET @s6 = IF(@c6 > 0, 'ALTER TABLE seller DROP CHECK seller_chk_6', 'SELECT 1');
PREPARE st6 FROM @s6; EXECUTE st6; DEALLOCATE PREPARE st6;

SELECT COUNT(*) INTO @c7 FROM information_schema.table_constraints WHERE constraint_schema=@schema_name AND table_name='seller' AND constraint_name='seller_chk_7' AND constraint_type='CHECK';
SET @s7 = IF(@c7 > 0, 'ALTER TABLE seller DROP CHECK seller_chk_7', 'SELECT 1');
PREPARE st7 FROM @s7; EXECUTE st7; DEALLOCATE PREPARE st7;

SELECT COUNT(*) INTO @c8 FROM information_schema.table_constraints WHERE constraint_schema=@schema_name AND table_name='seller' AND constraint_name='seller_chk_8' AND constraint_type='CHECK';
SET @s8 = IF(@c8 > 0, 'ALTER TABLE seller DROP CHECK seller_chk_8', 'SELECT 1');
PREPARE st8 FROM @s8; EXECUTE st8; DEALLOCATE PREPARE st8;

SELECT COUNT(*) INTO @c9 FROM information_schema.table_constraints WHERE constraint_schema=@schema_name AND table_name='seller' AND constraint_name='seller_chk_9' AND constraint_type='CHECK';
SET @s9 = IF(@c9 > 0, 'ALTER TABLE seller DROP CHECK seller_chk_9', 'SELECT 1');
PREPARE st9 FROM @s9; EXECUTE st9; DEALLOCATE PREPARE st9;

SELECT COUNT(*) INTO @c10 FROM information_schema.table_constraints WHERE constraint_schema=@schema_name AND table_name='seller' AND constraint_name='seller_chk_10' AND constraint_type='CHECK';
SET @s10 = IF(@c10 > 0, 'ALTER TABLE seller DROP CHECK seller_chk_10', 'SELECT 1');
PREPARE st10 FROM @s10; EXECUTE st10; DEALLOCATE PREPARE st10;

SELECT COUNT(*) INTO @c11 FROM information_schema.table_constraints WHERE constraint_schema=@schema_name AND table_name='seller' AND constraint_name='seller_chk_11' AND constraint_type='CHECK';
SET @s11 = IF(@c11 > 0, 'ALTER TABLE seller DROP CHECK seller_chk_11', 'SELECT 1');
PREPARE st11 FROM @s11; EXECUTE st11; DEALLOCATE PREPARE st11;

SELECT COUNT(*) INTO @c12 FROM information_schema.table_constraints WHERE constraint_schema=@schema_name AND table_name='seller' AND constraint_name='seller_chk_12' AND constraint_type='CHECK';
SET @s12 = IF(@c12 > 0, 'ALTER TABLE seller DROP CHECK seller_chk_12', 'SELECT 1');
PREPARE st12 FROM @s12; EXECUTE st12; DEALLOCATE PREPARE st12;

-- Keep seller columns flexible to avoid enum/check conflicts across schema versions
ALTER TABLE seller MODIFY COLUMN role VARCHAR(32) NOT NULL;
ALTER TABLE seller MODIFY COLUMN account_status VARCHAR(64) NULL;
ALTER TABLE seller MODIFY COLUMN business_type VARCHAR(64) NULL;

-- Normalize legacy values to current app format
UPDATE seller
SET role = CASE role
    WHEN 'ADMIN' THEN 'ROLE_ADMIN'
    WHEN 'CUSTOMER' THEN 'ROLE_CUSTOMER'
    WHEN 'SELLER' THEN 'ROLE_SELLER'
    ELSE role
END;

UPDATE seller
SET account_status = CASE account_status
    WHEN 'VERIFIED' THEN 'ACTIVE'
    WHEN 'INACTIVE' THEN 'DEACTIVATED'
    WHEN 'DISABLED' THEN 'SUSPENDED'
    ELSE account_status
END;
