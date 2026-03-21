ALTER TABLE product
    ADD COLUMN is_active BIT NOT NULL DEFAULT b'1';

UPDATE product
SET is_active = b'1'
WHERE is_active IS NULL;
