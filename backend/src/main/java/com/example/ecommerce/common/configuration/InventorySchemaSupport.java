package com.example.ecommerce.common.configuration;

import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.ConnectionCallback;
import org.springframework.jdbc.core.JdbcTemplate;

@Slf4j
final class InventorySchemaSupport {

    private final JdbcTemplate jdbcTemplate;

    InventorySchemaSupport(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    JdbcTemplate jdbcTemplate() {
        return jdbcTemplate;
    }

    boolean tableExists(String tableName) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM information_schema.tables WHERE LOWER(table_name) = LOWER(?)",
                Integer.class,
                tableName
        );
        return count != null && count > 0;
    }

    boolean columnExists(String tableName, String columnName) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM information_schema.columns " +
                        "WHERE LOWER(table_name) = LOWER(?) AND LOWER(column_name) = LOWER(?)",
                Integer.class,
                tableName,
                columnName
        );
        return count != null && count > 0;
    }

    void ensureColumnType(String tableName, String columnName, String columnDefinition) {
        if (columnExists(tableName, columnName)) {
            jdbcTemplate.execute(
                    "ALTER TABLE " + tableName + " MODIFY COLUMN " + columnName + " " + columnDefinition
            );
        }
    }

    void ensureColumn(String tableName, String columnName, String columnDefinition) {
        if (!columnExists(tableName, columnName)) {
            jdbcTemplate.execute(
                    "ALTER TABLE " + tableName + " ADD COLUMN " + columnName + " " + columnDefinition
            );
            log.info("Added missing column {}.{}", tableName, columnName);
        }
    }

    void ensureUniqueIndex(String tableName, String indexName, String columnsSql) {
        Integer count = null;
        try {
            count = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM information_schema.statistics " +
                            "WHERE LOWER(table_name) = LOWER(?) AND LOWER(index_name) = LOWER(?)",
                    Integer.class,
                    tableName,
                    indexName
            );
        } catch (Exception ex) {
            log.debug(
                    "Skipping index existence lookup for {} on {} because metadata query failed: {}",
                    indexName,
                    tableName,
                    ex.getMessage()
            );
        }
        if (count != null && count > 0) {
            return;
        }
        try {
            jdbcTemplate.execute(
                    "CREATE UNIQUE INDEX " + indexName +
                            " ON " + tableName + " (" + columnsSql + ")"
            );
            log.info("Added unique index {} on {}({})", indexName, tableName, columnsSql);
        } catch (Exception ex) {
            log.warn("Could not create unique index {} on {}({}): {}", indexName, tableName, columnsSql, ex.getMessage());
        }
    }

    String userTableReference() {
        String databaseProductName = jdbcTemplate.execute((ConnectionCallback<String>) connection ->
                connection.getMetaData().getDatabaseProductName()
        );
        return databaseProductName != null && databaseProductName.toLowerCase().contains("h2")
                ? "\"user\""
                : "user";
    }

    String emptyEnumAsTextCondition(String columnName) {
        return "TRIM(CAST(" + columnName + " AS CHAR)) = ''";
    }
}
