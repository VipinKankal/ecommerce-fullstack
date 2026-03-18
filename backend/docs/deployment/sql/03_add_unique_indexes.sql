-- 03_add_unique_indexes.sql
-- Run only after duplicates are zero.

CREATE UNIQUE INDEX ux_seller_email ON seller (email);
CREATE UNIQUE INDEX ux_user_email ON `user` (email);
