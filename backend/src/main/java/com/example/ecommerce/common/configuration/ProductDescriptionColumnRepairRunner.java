package com.example.ecommerce.common.configuration;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@Profile("!test")
@RequiredArgsConstructor
public class ProductDescriptionColumnRepairRunner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(ProductDescriptionColumnRepairRunner.class);
    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(ApplicationArguments args) {
        String schema = jdbcTemplate.queryForObject("SELECT DATABASE()", String.class);
        if (schema == null || schema.isBlank()) {
            log.warn("Skipping product description column repair because active schema could not be resolved.");
            return;
        }

        try {
            String columnType = jdbcTemplate.queryForObject("""
                    SELECT column_type
                    FROM information_schema.columns
                    WHERE table_schema = ?
                      AND table_name = 'product'
                      AND column_name = 'description'
                    """, String.class, schema);

            if (columnType == null || columnType.isBlank()) {
                log.warn("Skipping product description column repair because product.description was not found in schema {}", schema);
                return;
            }

            String normalized = columnType.toLowerCase();
            if (normalized.contains("text")) {
                log.info("product.description already uses compatible type {} in schema {}", columnType, schema);
                return;
            }

            jdbcTemplate.execute("ALTER TABLE product MODIFY COLUMN description TEXT");
            log.info("Updated product.description from {} to TEXT in schema {}", columnType, schema);
        } catch (Exception ex) {
            log.warn("Product description column repair skipped/failed: {}", ex.getMessage());
        }
    }
}
