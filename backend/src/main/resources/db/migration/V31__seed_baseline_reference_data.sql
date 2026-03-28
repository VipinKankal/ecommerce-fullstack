-- Ensure table-based sequence rows exist for baseline installs.
INSERT INTO address_seq (next_val) SELECT 1 WHERE NOT EXISTS (SELECT 1 FROM address_seq);
INSERT INTO cart_seq (next_val) SELECT 1 WHERE NOT EXISTS (SELECT 1 FROM cart_seq);
INSERT INTO category_seq (next_val) SELECT 1 WHERE NOT EXISTS (SELECT 1 FROM category_seq);
INSERT INTO cart_item_seq (next_val) SELECT 1 WHERE NOT EXISTS (SELECT 1 FROM cart_item_seq);
INSERT INTO deal_seq (next_val) SELECT 1 WHERE NOT EXISTS (SELECT 1 FROM deal_seq);
INSERT INTO coupon_seq (next_val) SELECT 1 WHERE NOT EXISTS (SELECT 1 FROM coupon_seq);
INSERT INTO coupon_event_log_seq (next_val) SELECT 1 WHERE NOT EXISTS (SELECT 1 FROM coupon_event_log_seq);
INSERT INTO coupon_user_map_seq (next_val) SELECT 1 WHERE NOT EXISTS (SELECT 1 FROM coupon_user_map_seq);
INSERT INTO coupon_usage_seq (next_val) SELECT 1 WHERE NOT EXISTS (SELECT 1 FROM coupon_usage_seq);
INSERT INTO orders_seq (next_val) SELECT 1 WHERE NOT EXISTS (SELECT 1 FROM orders_seq);
INSERT INTO home_category_seq (next_val) SELECT 1 WHERE NOT EXISTS (SELECT 1 FROM home_category_seq);
INSERT INTO payment_order_seq (next_val) SELECT 1 WHERE NOT EXISTS (SELECT 1 FROM payment_order_seq);
INSERT INTO order_item_seq (next_val) SELECT 1 WHERE NOT EXISTS (SELECT 1 FROM order_item_seq);
INSERT INTO seller_report_seq (next_val) SELECT 1 WHERE NOT EXISTS (SELECT 1 FROM seller_report_seq);
INSERT INTO product_variant_seq (next_val) SELECT 1 WHERE NOT EXISTS (SELECT 1 FROM product_variant_seq);
INSERT INTO product_restock_subscriptions_seq (next_val) SELECT 1 WHERE NOT EXISTS (SELECT 1 FROM product_restock_subscriptions_seq);
INSERT INTO product_restock_notification_logs_seq (next_val) SELECT 1 WHERE NOT EXISTS (SELECT 1 FROM product_restock_notification_logs_seq);
INSERT INTO wishlist_seq (next_val) SELECT 1 WHERE NOT EXISTS (SELECT 1 FROM wishlist_seq);
INSERT INTO seller_seq (next_val) SELECT 1 WHERE NOT EXISTS (SELECT 1 FROM seller_seq);
INSERT INTO verification_code_seq (next_val) SELECT 1 WHERE NOT EXISTS (SELECT 1 FROM verification_code_seq);
INSERT INTO review_seq (next_val) SELECT 1 WHERE NOT EXISTS (SELECT 1 FROM review_seq);
INSERT INTO user_seq (next_val) SELECT 1 WHERE NOT EXISTS (SELECT 1 FROM user_seq);
INSERT INTO product_seq (next_val) SELECT 1 WHERE NOT EXISTS (SELECT 1 FROM product_seq);
INSERT INTO transaction_seq (next_val) SELECT 1 WHERE NOT EXISTS (SELECT 1 FROM transaction_seq);

-- Ensure tax defaults exist after B30 baseline path.
INSERT INTO tax_rule_versions (
    rule_code,
    rule_type,
    tax_class,
    hsn_code,
    supply_type,
    min_taxable_value,
    max_taxable_value,
    rate_percentage,
    effective_from,
    effective_to,
    published,
    source_reference,
    notes,
    value_basis,
    approval_status,
    approved_at,
    approved_by,
    signed_memo_reference
)
SELECT
    seed.rule_code,
    seed.rule_type,
    seed.tax_class,
    seed.hsn_code,
    seed.supply_type,
    seed.min_taxable_value,
    seed.max_taxable_value,
    seed.rate_percentage,
    seed.effective_from,
    seed.effective_to,
    seed.published,
    seed.source_reference,
    seed.notes,
    seed.value_basis,
    'CA_APPROVED',
    CURRENT_TIMESTAMP,
    'SYSTEM_MIGRATION',
    seed.source_reference
FROM (
    SELECT 'APPAREL_GST_V2023_0401_LOW' AS rule_code, 'GST' AS rule_type, 'APPAREL_STANDARD' AS tax_class,
           NULL AS hsn_code, 'ANY' AS supply_type, 0 AS min_taxable_value, 1000 AS max_taxable_value,
           5 AS rate_percentage, DATE '2023-04-01' AS effective_from, DATE '2025-09-21' AS effective_to,
           1 AS published, 'CBIC rates as on 01-04-2023' AS source_reference,
           'Apparel lower slab up to Rs 1000 per piece' AS notes, 'SELLING_PRICE_PER_PIECE' AS value_basis
    UNION ALL
    SELECT 'APPAREL_GST_V2023_0401_HIGH', 'GST', 'APPAREL_STANDARD',
           NULL, 'ANY', 1000.01, NULL,
           12, DATE '2023-04-01', DATE '2025-09-21',
           1, 'CBIC rates as on 01-04-2023',
           'Apparel higher slab above Rs 1000 per piece', 'SELLING_PRICE_PER_PIECE'
    UNION ALL
    SELECT 'APPAREL_GST_V2025_0922_LOW', 'GST', 'APPAREL_STANDARD',
           NULL, 'ANY', 0, 2500,
           5, DATE '2025-09-22', NULL,
           1, '56th GST Council press pack',
           'Apparel lower slab up to Rs 2500 per piece', 'SELLING_PRICE_PER_PIECE'
    UNION ALL
    SELECT 'APPAREL_GST_V2025_0922_HIGH', 'GST', 'APPAREL_STANDARD',
           NULL, 'ANY', 2500.01, NULL,
           18, DATE '2025-09-22', NULL,
           1, '56th GST Council press pack',
           'Apparel higher slab above Rs 2500 per piece', 'SELLING_PRICE_PER_PIECE'
    UNION ALL
    SELECT 'TCS_IGST_V2024_0710', 'TCS', 'MARKETPLACE',
           NULL, 'INTER_STATE', NULL, NULL,
           0.5, DATE '2024-07-10', NULL,
           1, 'Notification 01/2024-Integrated Tax',
           'TCS for inter-state supplies through ECO', 'TAXABLE_VALUE'
    UNION ALL
    SELECT 'TCS_CGST_V2024_0710', 'TCS', 'MARKETPLACE',
           NULL, 'INTRA_STATE', NULL, NULL,
           0.25, DATE '2024-07-10', NULL,
           1, 'Notification 15/2024-Central Tax',
           'CGST-side TCS for intra-state supplies through ECO', 'TAXABLE_VALUE'
) AS seed
WHERE NOT EXISTS (
    SELECT 1 FROM tax_rule_versions existing WHERE existing.rule_code = seed.rule_code
);

-- Ensure HSN mapping seed exists after B30 baseline path.
INSERT INTO hsn_master_rules (
    rule_code,
    ui_category_key,
    display_label,
    construction_type,
    gender,
    fiber_family,
    hsn_chapter,
    hsn_code,
    tax_class,
    mapping_mode,
    effective_from,
    effective_to,
    approval_status,
    published,
    source_reference,
    notes
)
SELECT
    seed.rule_code,
    seed.ui_category_key,
    seed.display_label,
    seed.construction_type,
    seed.gender,
    seed.fiber_family,
    seed.hsn_chapter,
    seed.hsn_code,
    seed.tax_class,
    seed.mapping_mode,
    seed.effective_from,
    seed.effective_to,
    seed.approval_status,
    seed.published,
    seed.source_reference,
    seed.notes
FROM (
    SELECT 'HSN_MEN_T_SHIRTS_KNIT' AS rule_code, 'men_t_shirts' AS ui_category_key, 'Men T-Shirts' AS display_label,
           'KNITTED' AS construction_type, 'MALE' AS gender, NULL AS fiber_family, '61' AS hsn_chapter,
           '6109' AS hsn_code, 'APPAREL_STANDARD' AS tax_class, 'DIRECT' AS mapping_mode,
           DATE '2023-04-01' AS effective_from, NULL AS effective_to, 'CA_APPROVED' AS approval_status,
           1 AS published, 'Initial CA apparel sheet' AS source_reference,
           'Knitted t-shirts map to chapter 61 HSN 6109' AS notes
    UNION ALL
    SELECT 'HSN_MEN_SHIRTS_WOVEN', 'men_shirts', 'Men Shirts', 'WOVEN', 'MALE', NULL, '62', '6205',
           'APPAREL_STANDARD', 'DIRECT', DATE '2023-04-01', NULL, 'CA_APPROVED', 1,
           'Initial CA apparel sheet', 'Woven men shirts map to 6205'
    UNION ALL
    SELECT 'HSN_MEN_JEANS_WOVEN', 'men_jeans', 'Men Jeans', 'WOVEN', 'MALE', NULL, '62', '6203',
           'APPAREL_STANDARD', 'DIRECT', DATE '2023-04-01', NULL, 'CA_APPROVED', 1,
           'Initial CA apparel sheet', 'Men jeans map to 6203 when sold as woven lowers'
    UNION ALL
    SELECT 'HSN_MEN_TROUSERS_WOVEN', 'men_trousers', 'Men Trousers', 'WOVEN', 'MALE', NULL, '62', '6203',
           'APPAREL_STANDARD', 'DIRECT', DATE '2023-04-01', NULL, 'CA_APPROVED', 1,
           'Initial CA apparel sheet', 'Men trousers map to 6203 when sold as woven lowers'
    UNION ALL
    SELECT 'HSN_WOMEN_TOPS_KNIT', 'tops', 'Women Tops', 'KNITTED', 'FEMALE', NULL, '61', '6110',
           'APPAREL_STANDARD', 'DIRECT', DATE '2023-04-01', NULL, 'CA_APPROVED', 1,
           'Initial CA apparel sheet', 'Knitted women tops map to chapter 61 knitwear'
    UNION ALL
    SELECT 'HSN_WOMEN_TOPS_WOVEN', 'tops', 'Women Tops', 'WOVEN', 'FEMALE', NULL, '62', '6206',
           'APPAREL_STANDARD', 'DIRECT', DATE '2023-04-01', NULL, 'CA_APPROVED', 1,
           'Initial CA apparel sheet', 'Woven women tops map to 6206'
    UNION ALL
    SELECT 'HSN_WOMEN_JEANS_WOVEN', 'jeans', 'Women Jeans', 'WOVEN', 'FEMALE', NULL, '62', '6204',
           'APPAREL_STANDARD', 'DIRECT', DATE '2023-04-01', NULL, 'CA_APPROVED', 1,
           'Initial CA apparel sheet', 'Women jeans map to 6204 when sold as woven lowers'
    UNION ALL
    SELECT 'HSN_WOMEN_KURTIS_WOVEN', 'kurtis', 'Kurtis', 'WOVEN', 'FEMALE', NULL, '62', '6204',
           'APPAREL_STANDARD', 'RULE_BASED', DATE '2023-04-01', NULL, 'CA_APPROVED', 1,
           'Initial CA apparel sheet', 'Final kurti mapping should remain CA-reviewed before auto-publish'
    UNION ALL
    SELECT 'HSN_SPORTY_JACKET_KNIT', 'sporty_jacket', 'Sporty Jacket', 'KNITTED', 'FEMALE', NULL, '61', '6102',
           'APPAREL_STANDARD', 'DIRECT', DATE '2023-04-01', NULL, 'CA_APPROVED', 1,
           'Initial CA apparel sheet', 'Knitted women jackets map to 6102'
    UNION ALL
    SELECT 'HSN_SAREE_FIBER_REQUIRED', 'saree', 'Saree', NULL, 'FEMALE', NULL, NULL, NULL,
           'TEXTILE_FIBER_BASED', 'FIBER_REQUIRED', DATE '2023-04-01', NULL, 'CA_APPROVED', 1,
           'CBIC FAQ fibre-based mapping guidance', 'Saree mapping depends on constituent fibre and must not be hardcoded'
    UNION ALL
    SELECT 'HSN_DHOTI_FIBER_REQUIRED', 'dhoti', 'Dhoti', NULL, 'MALE', NULL, NULL, NULL,
           'TEXTILE_FIBER_BASED', 'FIBER_REQUIRED', DATE '2023-04-01', NULL, 'CA_APPROVED', 1,
           'CBIC FAQ fibre-based mapping guidance', 'Dhoti mapping depends on constituent fibre and must not be hardcoded'
) AS seed
WHERE NOT EXISTS (
    SELECT 1 FROM hsn_master_rules existing WHERE existing.rule_code = seed.rule_code
);
