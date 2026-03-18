-- 02_cleanup_duplicate_emails.sql
-- IMPORTANT:
-- 1) Take database backup before running.
-- 2) Keep the oldest record per email and rename newer duplicates.
-- 3) Review output and then run 03_add_unique_indexes.sql.

-- Seller duplicates: keep lowest id unchanged, rename others.
WITH ranked_seller AS (
    SELECT id, email,
           ROW_NUMBER() OVER (PARTITION BY email ORDER BY id) AS rn
    FROM seller
)
UPDATE seller s
JOIN ranked_seller r ON s.id = r.id
SET s.email = CONCAT('dedup+', s.id, '+', s.email)
WHERE r.rn > 1;

-- User duplicates: keep lowest id unchanged, rename others.
WITH ranked_user AS (
    SELECT id, email,
           ROW_NUMBER() OVER (PARTITION BY email ORDER BY id) AS rn
    FROM `user`
)
UPDATE `user` u
JOIN ranked_user r ON u.id = r.id
SET u.email = CONCAT('dedup+', u.id, '+', u.email)
WHERE r.rn > 1;

-- Re-check
SELECT 'seller' AS table_name, email, COUNT(*) AS duplicate_count
FROM seller
GROUP BY email
HAVING COUNT(*) > 1;

SELECT 'user' AS table_name, email, COUNT(*) AS duplicate_count
FROM `user`
GROUP BY email
HAVING COUNT(*) > 1;
