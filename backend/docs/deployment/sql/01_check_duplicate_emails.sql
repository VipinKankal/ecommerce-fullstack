-- 01_check_duplicate_emails.sql
-- Run before enforcing unique indexes.

SELECT 'seller' AS table_name, email, COUNT(*) AS duplicate_count
FROM seller
GROUP BY email
HAVING COUNT(*) > 1;

SELECT 'user' AS table_name, email, COUNT(*) AS duplicate_count
FROM `user`
GROUP BY email
HAVING COUNT(*) > 1;
