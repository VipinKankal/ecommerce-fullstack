-- Repair legacy variant stock assignment:
-- Older variant creation logic stored initial quantity in warehouse_stock.
-- This script moves that quantity to seller_stock only for untouched products
-- (products that have no movement other than PRODUCT_ADDED).

UPDATE product_variants pv
JOIN (
    SELECT p.id
    FROM product p
    JOIN product_variants pv2 ON pv2.product_id = p.id
    GROUP BY p.id
    HAVING COALESCE(SUM(pv2.seller_stock), 0) = 0
       AND COALESCE(SUM(pv2.warehouse_stock), 0) > 0
       AND NOT EXISTS (
            SELECT 1
            FROM inventory_movements im
            WHERE im.product_id = p.id
              AND COALESCE(im.action, '') <> 'PRODUCT_ADDED'
       )
) candidate_products ON candidate_products.id = pv.product_id
SET pv.seller_stock = COALESCE(pv.warehouse_stock, 0),
    pv.warehouse_stock = 0;

UPDATE product p
JOIN (
    SELECT product_id,
           COALESCE(SUM(seller_stock), 0) AS seller_total,
           COALESCE(SUM(warehouse_stock), 0) AS warehouse_total
    FROM product_variants
    GROUP BY product_id
) variant_totals ON variant_totals.product_id = p.id
SET p.seller_stock = variant_totals.seller_total,
    p.warehouse_stock = variant_totals.warehouse_total,
    p.quantity = variant_totals.warehouse_total;

