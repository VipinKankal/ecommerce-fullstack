package com.example.ecommerce.common.configuration;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class HibernateSequenceRepairRunner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(HibernateSequenceRepairRunner.class);

    private static final List<String> SEQUENCE_TABLES = List.of(
            "address_seq",
            "cart_seq",
            "category_seq",
            "cart_item_seq",
            "deal_seq",
            "coupon_seq",
            "orders_seq",
            "home_category_seq",
            "payment_order_seq",
            "order_item_seq",
            "seller_report_seq",
            "wishlist_seq",
            "seller_seq",
            "verification_code_seq",
            "review_seq",
            "user_seq",
            "product_seq",
            "transaction_seq"
    );

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(ApplicationArguments args) {
        String schema = jdbcTemplate.queryForObject("SELECT DATABASE()", String.class);
        if (schema == null || schema.isBlank()) {
            log.warn("Skipping Hibernate sequence repair because active schema could not be resolved.");
            return;
        }

        for (String table : SEQUENCE_TABLES) {
            Integer count = jdbcTemplate.queryForObject("""
                    SELECT COUNT(*)
                    FROM information_schema.tables
                    WHERE table_schema = ?
                      AND table_name = ?
                    """, Integer.class, schema, table);

            if (count == null || count == 0) {
                jdbcTemplate.execute("CREATE TABLE `" + table + "` (next_val BIGINT)");
                jdbcTemplate.execute("INSERT INTO `" + table + "` (next_val) VALUES (1)");
                log.info("Created missing Hibernate sequence table {} in schema {}", table, schema);
                continue;
            }

            Integer rows = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM `" + table + "`", Integer.class);
            if (rows == null || rows == 0) {
                jdbcTemplate.execute("INSERT INTO `" + table + "` (next_val) VALUES (1)");
                log.info("Seeded empty Hibernate sequence table {} in schema {}", table, schema);
            }
        }
    }
}
