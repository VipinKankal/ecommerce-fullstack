SET @schema_name = DATABASE();

SELECT COUNT(*)
INTO @has_seller_chk_2
FROM information_schema.table_constraints
WHERE constraint_schema = @schema_name
  AND table_name = 'seller'
  AND constraint_name = 'seller_chk_2'
  AND constraint_type = 'CHECK';

SET @drop_check_sql = IF(
  @has_seller_chk_2 > 0,
  'ALTER TABLE seller DROP CHECK seller_chk_2',
  'SELECT 1'
);
PREPARE drop_check_stmt FROM @drop_check_sql;
EXECUTE drop_check_stmt;
DEALLOCATE PREPARE drop_check_stmt;

SET @alter_role_sql = 'ALTER TABLE seller MODIFY COLUMN role VARCHAR(32) NOT NULL';
PREPARE alter_role_stmt FROM @alter_role_sql;
EXECUTE alter_role_stmt;
DEALLOCATE PREPARE alter_role_stmt;

UPDATE seller
SET role = CASE role
    WHEN 'ADMIN' THEN 'ROLE_ADMIN'
    WHEN 'CUSTOMER' THEN 'ROLE_CUSTOMER'
    WHEN 'SELLER' THEN 'ROLE_SELLER'
    ELSE role
END;
