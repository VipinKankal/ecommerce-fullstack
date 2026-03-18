-- Enforce unique emails for seller and user entities.
-- If duplicate data already exists, unique index creation is skipped (non-breaking migration).
-- After duplicate cleanup, run a new migration to force unique index creation.

-- seller(email) unique
SET @idx_exists := (
    SELECT COUNT(1)
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'seller'
      AND index_name = 'ux_seller_email'
);
SET @dup_exists := (
    SELECT COUNT(1)
    FROM (
        SELECT email
        FROM seller
        GROUP BY email
        HAVING COUNT(*) > 1
    ) dup
);
SET @sql := IF(
    @idx_exists = 0 AND @dup_exists = 0,
    'CREATE UNIQUE INDEX ux_seller_email ON seller (email)',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- user(email) unique
SET @idx_exists := (
    SELECT COUNT(1)
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'user'
      AND index_name = 'ux_user_email'
);
SET @dup_exists := (
    SELECT COUNT(1)
    FROM (
        SELECT email
        FROM `user`
        GROUP BY email
        HAVING COUNT(*) > 1
    ) dup
);
SET @sql := IF(
    @idx_exists = 0 AND @dup_exists = 0,
    'CREATE UNIQUE INDEX ux_user_email ON `user` (email)',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
