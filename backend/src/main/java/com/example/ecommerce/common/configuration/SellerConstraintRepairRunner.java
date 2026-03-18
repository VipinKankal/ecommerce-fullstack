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
public class SellerConstraintRepairRunner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(SellerConstraintRepairRunner.class);
    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(ApplicationArguments args) {
        String schema = jdbcTemplate.queryForObject("SELECT DATABASE()", String.class);
        if (schema == null || schema.isBlank()) {
            log.warn("Skipping seller constraint repair because active schema could not be resolved.");
            return;
        }

        try {
            List<String> checkConstraints = jdbcTemplate.queryForList("""
                    SELECT constraint_name
                    FROM information_schema.table_constraints
                    WHERE constraint_schema = ?
                      AND table_name = 'seller'
                      AND constraint_type = 'CHECK'
                    """, String.class, schema);

            if (checkConstraints.isEmpty()) {
                log.info("No seller CHECK constraints found in schema {}", schema);
            } else {
                for (String constraint : checkConstraints) {
                    String escaped = "`" + constraint + "`";
                    try {
                        jdbcTemplate.execute("ALTER TABLE seller DROP CHECK " + escaped);
                        log.info("Dropped seller CHECK constraint {} in schema {}", constraint, schema);
                    } catch (Exception dropCheckEx) {
                        try {
                            jdbcTemplate.execute("ALTER TABLE seller DROP CONSTRAINT " + escaped);
                            log.info("Dropped seller constraint {} using DROP CONSTRAINT in schema {}", constraint, schema);
                        } catch (Exception dropConstraintEx) {
                            log.warn(
                                    "Could not drop seller constraint {} (DROP CHECK: {}; DROP CONSTRAINT: {})",
                                    constraint,
                                    dropCheckEx.getMessage(),
                                    dropConstraintEx.getMessage()
                            );
                        }
                    }
                }
            }

            jdbcTemplate.execute("ALTER TABLE seller MODIFY COLUMN role VARCHAR(32) NOT NULL");
            jdbcTemplate.execute("ALTER TABLE seller MODIFY COLUMN account_status VARCHAR(64) NULL");
            jdbcTemplate.execute("ALTER TABLE seller MODIFY COLUMN business_type VARCHAR(64) NULL");

            jdbcTemplate.execute("""
                    UPDATE seller
                    SET role = CASE role
                        WHEN 'ADMIN' THEN 'ROLE_ADMIN'
                        WHEN 'CUSTOMER' THEN 'ROLE_CUSTOMER'
                        WHEN 'SELLER' THEN 'ROLE_SELLER'
                        ELSE role
                    END
                    """);

            jdbcTemplate.execute("""
                    UPDATE seller
                    SET account_status = CASE account_status
                        WHEN 'VERIFIED' THEN 'ACTIVE'
                        WHEN 'INACTIVE' THEN 'DEACTIVATED'
                        WHEN 'DISABLED' THEN 'SUSPENDED'
                        ELSE account_status
                    END
                    """);

            log.info("Seller schema/value normalization completed in schema {}", schema);
        } catch (Exception ex) {
            log.warn("Seller constraint repair skipped/failed: {}", ex.getMessage());
        }
    }
}
