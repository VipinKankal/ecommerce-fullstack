ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS payment_method VARCHAR(64) NULL,
    ADD COLUMN IF NOT EXISTS payment_type VARCHAR(64) NULL,
    ADD COLUMN IF NOT EXISTS provider VARCHAR(64) NULL;

ALTER TABLE payment_order
    ADD COLUMN IF NOT EXISTS payment_type VARCHAR(64) NULL,
    ADD COLUMN IF NOT EXISTS provider VARCHAR(64) NULL,
    ADD COLUMN IF NOT EXISTS merchant_transaction_id VARCHAR(128) NULL;

UPDATE payment_order
SET payment_method = CASE CAST(payment_method AS CHAR)
    WHEN 'RAZORPAY' THEN 'UPI'
    WHEN 'PHONEPE' THEN 'UPI'
    WHEN 'ONLINE' THEN 'UPI'
    WHEN 'STRIPE' THEN 'CARD'
    ELSE payment_method
END;

UPDATE payment_order
SET payment_type = CASE CAST(payment_method AS CHAR)
    WHEN 'COD' THEN 'CASH'
    WHEN 'UPI' THEN 'UPI'
    WHEN 'CARD' THEN 'CARD'
    ELSE payment_type
END
WHERE payment_type IS NULL;

UPDATE payment_order
SET provider = CASE
    WHEN provider IS NOT NULL AND provider <> '' THEN provider
    WHEN payment_method = 'UPI' THEN 'PHONEPE'
    WHEN payment_method = 'CARD' THEN 'STRIPE'
    ELSE provider
END;

UPDATE payment_order
SET merchant_transaction_id = payment_link_id
WHERE merchant_transaction_id IS NULL
  AND payment_link_id IS NOT NULL
  AND payment_link_id <> '';

UPDATE orders
SET payment_status = CASE CAST(payment_status AS CHAR)
    WHEN 'COMPLETED' THEN 'SUCCESS'
    ELSE payment_status
END;

UPDATE orders
SET status = CASE CAST(status AS CHAR)
    WHEN 'COMPLETED' THEN 'SUCCESS'
    ELSE status
END;

UPDATE payment_order
SET status = CASE CAST(status AS CHAR)
    WHEN 'COMPLETED' THEN 'SUCCESS'
    ELSE status
END;
