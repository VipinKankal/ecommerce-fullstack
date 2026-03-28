
/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `address` (
  `id` bigint NOT NULL,
  `address_line` varchar(255) DEFAULT NULL,
  `city` varchar(255) DEFAULT NULL,
  `locality` varchar(255) DEFAULT NULL,
  `mobile_number` varchar(255) DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `pin_code` varchar(255) DEFAULT NULL,
  `state` varchar(255) DEFAULT NULL,
  `street` varchar(255) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `country` varchar(255) DEFAULT NULL,
  `active` bit(1) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `address_seq` (
  `next_val` bigint DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_log_entries` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `method` varchar(16) NOT NULL,
  `path` varchar(255) NOT NULL,
  `status` int NOT NULL,
  `actor` varchar(255) NOT NULL,
  `ip_address` varchar(64) DEFAULT NULL,
  `duration_ms` bigint NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_audit_log_entries_created_at` (`created_at`),
  KEY `idx_audit_log_entries_actor` (`actor`),
  KEY `idx_audit_log_entries_path` (`path`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cart` (
  `id` bigint NOT NULL,
  `coupon_code` varchar(255) DEFAULT NULL,
  `discount` int NOT NULL,
  `total_items` int NOT NULL,
  `total_mrp_price` int NOT NULL,
  `total_selling_price` double NOT NULL,
  `user_id` bigint DEFAULT NULL,
  `coupon_discount_amount` double DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK9emlp6m95v5er2bcqkjsw48he` (`user_id`),
  CONSTRAINT `FKl70asp4l4w0jmbm1tqyofho4o` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cart_item` (
  `id` bigint NOT NULL,
  `mrp_price` int NOT NULL,
  `quantity` int NOT NULL,
  `selling_price` int NOT NULL,
  `size` varchar(255) DEFAULT NULL,
  `user_id` bigint DEFAULT NULL,
  `cart_id` bigint DEFAULT NULL,
  `product_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK1uobyhgl1wvgt1jpccia8xxs3` (`cart_id`),
  KEY `FKjcyd5wv4igqnw413rgxbfu4nv` (`product_id`),
  KEY `idx_cart_item_user_id` (`user_id`),
  CONSTRAINT `FK1uobyhgl1wvgt1jpccia8xxs3` FOREIGN KEY (`cart_id`) REFERENCES `cart` (`id`),
  CONSTRAINT `FKjcyd5wv4igqnw413rgxbfu4nv` FOREIGN KEY (`product_id`) REFERENCES `product` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cart_item_seq` (
  `next_val` bigint DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cart_seq` (
  `next_val` bigint DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `category` (
  `id` bigint NOT NULL,
  `category_id` varchar(255) DEFAULT NULL,
  `level` int DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `parent_category_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKop35ifsyq39mxtmfs1asvbltv` (`category_id`),
  KEY `FKs2ride9gvilxy2tcuv7witnxc` (`parent_category_id`),
  CONSTRAINT `FKs2ride9gvilxy2tcuv7witnxc` FOREIGN KEY (`parent_category_id`) REFERENCES `category` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `category_seq` (
  `next_val` bigint DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `compliance_challan_records` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tax_stream` varchar(32) NOT NULL,
  `filing_period` varchar(16) NOT NULL,
  `amount` double NOT NULL,
  `challan_reference` varchar(128) NOT NULL,
  `payment_status` varchar(32) NOT NULL,
  `paid_at` datetime DEFAULT NULL,
  `notes` text,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_compliance_challan_records_period` (`filing_period`),
  KEY `idx_compliance_challan_records_stream` (`tax_stream`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `compliance_seller_note_reads` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `note_id` bigint NOT NULL,
  `seller_id` bigint NOT NULL,
  `is_read` bit(1) NOT NULL DEFAULT b'1',
  `read_at` datetime DEFAULT NULL,
  `unread_at` datetime DEFAULT NULL,
  `acknowledged` bit(1) NOT NULL DEFAULT b'0',
  `acknowledged_at` datetime DEFAULT NULL,
  `unacknowledged_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_compliance_seller_note_reads_note_seller` (`note_id`,`seller_id`),
  KEY `idx_compliance_seller_note_reads_seller` (`seller_id`,`is_read`),
  KEY `idx_compliance_seller_note_reads_note` (`note_id`,`is_read`),
  CONSTRAINT `fk_compliance_seller_note_reads_note` FOREIGN KEY (`note_id`) REFERENCES `compliance_seller_notes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_compliance_seller_note_reads_seller` FOREIGN KEY (`seller_id`) REFERENCES `seller` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `compliance_seller_notes` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `note_type` varchar(32) NOT NULL,
  `priority` varchar(32) NOT NULL,
  `short_summary` varchar(1200) NOT NULL,
  `full_note` text NOT NULL,
  `effective_date` date DEFAULT NULL,
  `action_required` text,
  `affected_category` varchar(120) DEFAULT NULL,
  `business_email` varchar(255) NOT NULL,
  `status` varchar(32) NOT NULL DEFAULT 'DRAFT',
  `pinned` bit(1) NOT NULL DEFAULT b'0',
  `source_mode` varchar(32) NOT NULL DEFAULT 'MANUAL',
  `attachments_json` text,
  `created_by` varchar(255) DEFAULT NULL,
  `updated_by` varchar(255) DEFAULT NULL,
  `published_at` datetime DEFAULT NULL,
  `archived_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_compliance_seller_notes_status` (`status`,`pinned`,`published_at`,`updated_at`),
  KEY `idx_compliance_seller_notes_type` (`note_type`,`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `coupon` (
  `id` bigint NOT NULL,
  `code` varchar(255) DEFAULT NULL,
  `discount_percentage` double NOT NULL,
  `is_active` bit(1) NOT NULL,
  `minimum_order_value` double NOT NULL,
  `validity_end_date` date DEFAULT NULL,
  `validity_start_date` date DEFAULT NULL,
  `discount_type` varchar(32) DEFAULT NULL,
  `discount_value` double DEFAULT NULL,
  `max_discount` double DEFAULT NULL,
  `usage_limit` int DEFAULT NULL,
  `per_user_limit` int DEFAULT NULL,
  `used_count` int NOT NULL DEFAULT '0',
  `scope_type` varchar(32) DEFAULT NULL,
  `scope_id` bigint DEFAULT NULL,
  `first_order_only` tinyint(1) NOT NULL DEFAULT '0',
  `reserved_count` int NOT NULL DEFAULT '0',
  `user_eligibility_type` varchar(64) DEFAULT NULL,
  `inactive_days_threshold` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `coupon_event_log` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `coupon_id` bigint DEFAULT NULL,
  `coupon_code` varchar(255) DEFAULT NULL,
  `user_id` bigint DEFAULT NULL,
  `event_type` varchar(64) NOT NULL,
  `reason_code` varchar(128) DEFAULT NULL,
  `note` varchar(1200) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_coupon_event_log_created_at` (`created_at`),
  KEY `idx_coupon_event_log_coupon_id` (`coupon_id`),
  KEY `idx_coupon_event_log_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `coupon_event_log_seq` (
  `next_val` bigint DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `coupon_seq` (
  `next_val` bigint DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `coupon_usage` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `coupon_id` bigint DEFAULT NULL,
  `user_id` bigint DEFAULT NULL,
  `order_id` bigint DEFAULT NULL,
  `coupon_code` varchar(255) DEFAULT NULL,
  `discount_amount` double DEFAULT NULL,
  `used_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `coupon_usage_seq` (
  `next_val` bigint DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `coupon_user_map` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `coupon_id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  `created_at` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_coupon_user_map_coupon_user` (`coupon_id`,`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `coupon_user_map_seq` (
  `next_val` bigint DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `courier_assignments` (
  `id` bigint NOT NULL,
  `accepted_at` datetime(6) DEFAULT NULL,
  `assigned_at` datetime(6) DEFAULT NULL,
  `order_id` bigint DEFAULT NULL,
  `rejected_at` datetime(6) DEFAULT NULL,
  `rejection_reason` varchar(255) DEFAULT NULL,
  `status` enum('ACCEPTED','ASSIGNED','REJECTED') DEFAULT NULL,
  `courier_id` bigint DEFAULT NULL,
  `city` varchar(255) DEFAULT NULL,
  `delivery_window_label` varchar(255) DEFAULT NULL,
  `shipment_code` varchar(255) DEFAULT NULL,
  `zone` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FKne5ul5fthb385c727dhvvds4d` (`courier_id`),
  CONSTRAINT `FKne5ul5fthb385c727dhvvds4d` FOREIGN KEY (`courier_id`) REFERENCES `couriers` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `courier_assignments_seq` (
  `next_val` bigint DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `courier_cod_collections` (
  `id` bigint NOT NULL,
  `amount` int DEFAULT NULL,
  `collected_at` datetime(6) DEFAULT NULL,
  `order_id` bigint DEFAULT NULL,
  `payment_mode` varchar(255) DEFAULT NULL,
  `proof_url` varchar(255) DEFAULT NULL,
  `status` varchar(50) DEFAULT NULL,
  `transaction_id` varchar(255) DEFAULT NULL,
  `courier_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FKcc04pqo9h7w4c22wqljl012sh` (`courier_id`),
  CONSTRAINT `FKcc04pqo9h7w4c22wqljl012sh` FOREIGN KEY (`courier_id`) REFERENCES `couriers` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `courier_cod_collections_seq` (
  `next_val` bigint DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `courier_cod_deposit_items` (
  `id` bigint NOT NULL,
  `amount_allocated` int DEFAULT NULL,
  `cod_collection_id` bigint DEFAULT NULL,
  `settlement_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FKsep8wjwb2acjrmwkik0mty5jy` (`cod_collection_id`),
  KEY `FK14sx0xmwxk8t4uwf25j9bxeyj` (`settlement_id`),
  CONSTRAINT `FK14sx0xmwxk8t4uwf25j9bxeyj` FOREIGN KEY (`settlement_id`) REFERENCES `courier_cod_settlements` (`id`),
  CONSTRAINT `FKsep8wjwb2acjrmwkik0mty5jy` FOREIGN KEY (`cod_collection_id`) REFERENCES `courier_cod_collections` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `courier_cod_deposit_items_seq` (
  `next_val` bigint DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `courier_cod_settlements` (
  `id` bigint NOT NULL,
  `amount` int DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `deposited_at` datetime(6) DEFAULT NULL,
  `mode` varchar(255) DEFAULT NULL,
  `reference_id` varchar(255) DEFAULT NULL,
  `settlement_date` date DEFAULT NULL,
  `status` varchar(50) DEFAULT NULL,
  `courier_id` bigint DEFAULT NULL,
  `rejection_reason` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FKffmaa9precjfi60v07d0xv2x` (`courier_id`),
  CONSTRAINT `FKffmaa9precjfi60v07d0xv2x` FOREIGN KEY (`courier_id`) REFERENCES `couriers` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `courier_cod_settlements_seq` (
  `next_val` bigint DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `courier_deliveries` (
  `id` bigint NOT NULL,
  `cod_collected` bit(1) DEFAULT NULL,
  `cod_collected_amount` int DEFAULT NULL,
  `delivered_at` datetime(6) DEFAULT NULL,
  `failed_at` datetime(6) DEFAULT NULL,
  `failure_reason` varchar(255) DEFAULT NULL,
  `order_id` bigint DEFAULT NULL,
  `out_for_delivery_at` datetime(6) DEFAULT NULL,
  `picked_at` datetime(6) DEFAULT NULL,
  `pod_otp` varchar(255) DEFAULT NULL,
  `pod_photo_url` varchar(255) DEFAULT NULL,
  `status` varchar(50) DEFAULT NULL,
  `courier_id` bigint DEFAULT NULL,
  `accepted_at` datetime(6) DEFAULT NULL,
  `arrived_at` datetime(6) DEFAULT NULL,
  `delivery_photo_url` varchar(255) DEFAULT NULL,
  `geo_accuracy` decimal(38,2) DEFAULT NULL,
  `latitude` decimal(38,2) DEFAULT NULL,
  `longitude` decimal(38,2) DEFAULT NULL,
  `otp_verified` bit(1) DEFAULT NULL,
  `otp_verified_at` datetime(6) DEFAULT NULL,
  `payment_mode` varchar(255) DEFAULT NULL,
  `payment_screenshot_url` varchar(255) DEFAULT NULL,
  `payment_transaction_id` varchar(255) DEFAULT NULL,
  `confirmation_pending_at` datetime(6) DEFAULT NULL,
  `status_note` varchar(255) DEFAULT NULL,
  `status_reason` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FKe6dskw65bwj3se59ku7y5c6gc` (`courier_id`),
  CONSTRAINT `FKe6dskw65bwj3se59ku7y5c6gc` FOREIGN KEY (`courier_id`) REFERENCES `couriers` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `courier_deliveries_seq` (
  `next_val` bigint DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `courier_payroll_records` (
  `id` bigint NOT NULL,
  `base_salary` int DEFAULT NULL,
  `cod_collected` int DEFAULT NULL,
  `cod_deposited` int DEFAULT NULL,
  `cod_pending` int DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `deliveries_count` bigint DEFAULT NULL,
  `incentive_amount` int DEFAULT NULL,
  `locked_at` datetime(6) DEFAULT NULL,
  `paid_at` datetime(6) DEFAULT NULL,
  `payable_days` int DEFAULT NULL,
  `payout_mode` varchar(255) DEFAULT NULL,
  `payout_reference` varchar(255) DEFAULT NULL,
  `payroll_month` date DEFAULT NULL,
  `penalties` int DEFAULT NULL,
  `per_delivery_earnings` int DEFAULT NULL,
  `per_delivery_rate` int DEFAULT NULL,
  `petrol_allowance_approved` int DEFAULT NULL,
  `present_days` int DEFAULT NULL,
  `status` enum('DRAFT','LOCKED','PAID') DEFAULT NULL,
  `total_payable` int DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `courier_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKjawhg5rdm5k06pp4o2016l5ai` (`courier_id`,`payroll_month`),
  CONSTRAINT `FKc481js6107rplqythuuj32ebm` FOREIGN KEY (`courier_id`) REFERENCES `couriers` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `courier_payroll_records_seq` (
  `next_val` bigint DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `courier_petrol_claims` (
  `id` bigint NOT NULL,
  `amount` int DEFAULT NULL,
  `claim_month` date DEFAULT NULL,
  `receipt_url` varchar(255) DEFAULT NULL,
  `reviewed_at` datetime(6) DEFAULT NULL,
  `reviewer_note` varchar(255) DEFAULT NULL,
  `status` enum('APPROVED','PENDING','REJECTED') DEFAULT NULL,
  `submitted_at` datetime(6) DEFAULT NULL,
  `courier_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FKc7uq4fa3gpk9xhju0ieojxga8` (`courier_id`),
  CONSTRAINT `FKc7uq4fa3gpk9xhju0ieojxga8` FOREIGN KEY (`courier_id`) REFERENCES `couriers` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `courier_petrol_claims_seq` (
  `next_val` bigint DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `courier_salary_configs` (
  `id` bigint NOT NULL,
  `effective_from` date DEFAULT NULL,
  `monthly_base` int DEFAULT NULL,
  `per_delivery_rate` int DEFAULT NULL,
  `petrol_allowance_monthly_cap` int DEFAULT NULL,
  `petrol_allowance_type` varchar(40) DEFAULT NULL,
  `courier_id` bigint DEFAULT NULL,
  `attendance_basis_days` int DEFAULT NULL,
  `cod_mismatch_penalty` int DEFAULT NULL,
  `failed_penalty` int DEFAULT NULL,
  `incentive_amount` int DEFAULT NULL,
  `late_penalty` int DEFAULT NULL,
  `target_deliveries` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FKd8dnrkahrdl5chfdh1rrbkko8` (`courier_id`),
  CONSTRAINT `FKd8dnrkahrdl5chfdh1rrbkko8` FOREIGN KEY (`courier_id`) REFERENCES `couriers` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `courier_salary_configs_seq` (
  `next_val` bigint DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `couriers` (
  `id` bigint NOT NULL,
  `city` varchar(255) DEFAULT NULL,
  `cod_settlement_frequency` enum('DAILY','WEEKLY') DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `full_name` varchar(255) DEFAULT NULL,
  `joined_at` datetime(6) DEFAULT NULL,
  `kyc_doc_url` varchar(255) DEFAULT NULL,
  `kyc_id_number` varchar(255) DEFAULT NULL,
  `last_working_date` datetime(6) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `role` enum('ROLE_ADMIN','ROLE_COURIER','ROLE_CUSTOMER','ROLE_SELLER') DEFAULT NULL,
  `status` enum('ACTIVE','INACTIVE','SUSPENDED') DEFAULT NULL,
  `vehicle_number` varchar(255) DEFAULT NULL,
  `zone` varchar(255) DEFAULT NULL,
  `account_number` varchar(255) DEFAULT NULL,
  `address_line1` varchar(255) DEFAULT NULL,
  `address_line2` varchar(255) DEFAULT NULL,
  `address_proof_url` varchar(255) DEFAULT NULL,
  `bank_name` varchar(255) DEFAULT NULL,
  `dob` date DEFAULT NULL,
  `driving_license_url` varchar(255) DEFAULT NULL,
  `gender` varchar(255) DEFAULT NULL,
  `ifsc_code` varchar(255) DEFAULT NULL,
  `pan_number` varchar(255) DEFAULT NULL,
  `pincode` varchar(255) DEFAULT NULL,
  `profile_photo_url` varchar(255) DEFAULT NULL,
  `state` varchar(255) DEFAULT NULL,
  `upi_id` varchar(255) DEFAULT NULL,
  `vehicle_type` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `couriers_seq` (
  `next_val` bigint DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `deal` (
  `id` bigint NOT NULL,
  `discount` int DEFAULT NULL,
  `category_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK4mvlrtylin5pjn8y52o23b5io` (`category_id`),
  CONSTRAINT `FK14u5urp9o5t1vwhvk47npo005` FOREIGN KEY (`category_id`) REFERENCES `home_category` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `deal_seq` (
  `next_val` bigint DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `delivery_status_history` (
  `id` bigint NOT NULL,
  `courier_id` bigint DEFAULT NULL,
  `note` varchar(255) DEFAULT NULL,
  `order_id` bigint DEFAULT NULL,
  `proof_url` varchar(255) DEFAULT NULL,
  `reason` varchar(255) DEFAULT NULL,
  `status` enum('ACCEPTED','ARRIVED','ASSIGNED','CONFIRMATION_PENDING','DELIVERED','FAILED','OUT_FOR_DELIVERY','PICKED_UP') DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `updated_by` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `delivery_status_history_seq` (
  `next_val` bigint DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `flyway_bootstrap_marker` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `home_category` (
  `id` bigint NOT NULL,
  `category_id` varchar(255) DEFAULT NULL,
  `image` varchar(255) DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `section` tinyint DEFAULT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `home_category_chk_1` CHECK ((`section` between 0 and 3))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `home_category_seq` (
  `next_val` bigint DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hsn_master_rules` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `rule_code` varchar(120) NOT NULL,
  `ui_category_key` varchar(120) NOT NULL,
  `display_label` varchar(120) NOT NULL,
  `construction_type` varchar(32) DEFAULT NULL,
  `gender` varchar(32) DEFAULT NULL,
  `fiber_family` varchar(64) DEFAULT NULL,
  `hsn_chapter` varchar(8) DEFAULT NULL,
  `hsn_code` varchar(16) DEFAULT NULL,
  `tax_class` varchar(64) DEFAULT NULL,
  `mapping_mode` varchar(32) NOT NULL,
  `effective_from` date NOT NULL,
  `effective_to` date DEFAULT NULL,
  `approval_status` varchar(32) NOT NULL DEFAULT 'DRAFT',
  `published` bit(1) NOT NULL DEFAULT b'0',
  `source_reference` varchar(255) DEFAULT NULL,
  `notes` text,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_hsn_master_rules_rule_code` (`rule_code`),
  KEY `idx_hsn_master_rules_lookup` (`ui_category_key`,`published`,`effective_from`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inventory` (
  `id` bigint NOT NULL,
  `max_order_quantity` int DEFAULT NULL,
  `min_order_quantity` int DEFAULT NULL,
  `reserved_quantity` int DEFAULT NULL,
  `stock_quantity` int DEFAULT NULL,
  `stock_status` enum('IN_STOCK','LOW_STOCK','OUT_OF_STOCK','PREORDER') DEFAULT NULL,
  `warehouse_location` varchar(255) DEFAULT NULL,
  `product_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKce3rbi3bfstbvvyne34c1dvyv` (`product_id`),
  CONSTRAINT `FKp7gj4l80fx8v0uap3b2crjwp5` FOREIGN KEY (`product_id`) REFERENCES `product` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inventory_movements` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `product_id` bigint DEFAULT NULL,
  `order_item_id` bigint DEFAULT NULL,
  `request_id` bigint DEFAULT NULL,
  `request_type` varchar(255) DEFAULT NULL,
  `action` varchar(255) DEFAULT NULL,
  `from_location` varchar(255) DEFAULT NULL,
  `to_location` varchar(255) DEFAULT NULL,
  `quantity` int DEFAULT NULL,
  `movement_type` varchar(255) DEFAULT NULL,
  `order_status` varchar(255) DEFAULT NULL,
  `added_by` varchar(255) DEFAULT NULL,
  `updated_by` varchar(255) DEFAULT NULL,
  `note` varchar(1200) DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_inventory_movement_product` (`product_id`),
  CONSTRAINT `fk_inventory_movement_product` FOREIGN KEY (`product_id`) REFERENCES `product` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inventory_seq` (
  `next_val` bigint DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `manual_upi_payment` (
  `id` bigint NOT NULL,
  `amount` double DEFAULT NULL,
  `payment_app` varchar(255) DEFAULT NULL,
  `payment_screenshot` varchar(255) DEFAULT NULL,
  `rejection_reason` varchar(255) DEFAULT NULL,
  `status` enum('PENDING_VERIFICATION','REJECTED','VERIFIED') DEFAULT NULL,
  `submitted_at` datetime(6) DEFAULT NULL,
  `transaction_id` varchar(255) DEFAULT NULL,
  `verified_at` datetime(6) DEFAULT NULL,
  `customer_id` bigint DEFAULT NULL,
  `order_id` bigint DEFAULT NULL,
  `payment_order_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FKljyd3e06dupphkgb1ta4eselw` (`customer_id`),
  KEY `FK3gbk7oiygoojj80inb199cdt4` (`order_id`),
  KEY `FKn0sarnr8803h870uebwdt82p` (`payment_order_id`),
  CONSTRAINT `FK3gbk7oiygoojj80inb199cdt4` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`),
  CONSTRAINT `FKljyd3e06dupphkgb1ta4eselw` FOREIGN KEY (`customer_id`) REFERENCES `user` (`id`),
  CONSTRAINT `FKn0sarnr8803h870uebwdt82p` FOREIGN KEY (`payment_order_id`) REFERENCES `payment_order` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `manual_upi_payment_seq` (
  `next_val` bigint DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_item` (
  `id` bigint NOT NULL,
  `mrp_price` int DEFAULT NULL,
  `quantity` int NOT NULL,
  `selling_price` int DEFAULT NULL,
  `size` varchar(255) DEFAULT NULL,
  `user_id` bigint DEFAULT NULL,
  `order_id` bigint DEFAULT NULL,
  `product_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FKt4dc2r9nbvbujrljv3e23iibt` (`order_id`),
  KEY `FK551losx9j75ss5d6bfsqvijna` (`product_id`),
  CONSTRAINT `FK551losx9j75ss5d6bfsqvijna` FOREIGN KEY (`product_id`) REFERENCES `product` (`id`),
  CONSTRAINT `FKt4dc2r9nbvbujrljv3e23iibt` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_item_seq` (
  `next_val` bigint DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_return_exchange_request_history` (
  `request_id` bigint NOT NULL,
  `history_index` int NOT NULL,
  `status` varchar(255) DEFAULT NULL,
  `note` varchar(1200) DEFAULT NULL,
  `updated_by` varchar(255) DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`request_id`,`history_index`),
  CONSTRAINT `fk_order_return_exchange_request_history_request` FOREIGN KEY (`request_id`) REFERENCES `order_return_exchange_requests` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_return_exchange_requests` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `request_number` varchar(255) DEFAULT NULL,
  `request_type` varchar(255) DEFAULT NULL,
  `status` varchar(255) DEFAULT NULL,
  `order_id` bigint DEFAULT NULL,
  `order_item_id` bigint DEFAULT NULL,
  `customer_id` bigint DEFAULT NULL,
  `customer_name` varchar(255) DEFAULT NULL,
  `seller_id` bigint DEFAULT NULL,
  `product_id` bigint DEFAULT NULL,
  `product_title` varchar(255) DEFAULT NULL,
  `product_image` varchar(255) DEFAULT NULL,
  `quantity_requested` int DEFAULT NULL,
  `reason_code` varchar(255) DEFAULT NULL,
  `customer_comment` varchar(2000) DEFAULT NULL,
  `admin_comment` varchar(1200) DEFAULT NULL,
  `rejection_reason` varchar(1200) DEFAULT NULL,
  `courier_id` bigint DEFAULT NULL,
  `courier_name` varchar(255) DEFAULT NULL,
  `requested_new_product_id` bigint DEFAULT NULL,
  `requested_new_product_title` varchar(255) DEFAULT NULL,
  `requested_new_product_image` varchar(255) DEFAULT NULL,
  `requested_variant` varchar(255) DEFAULT NULL,
  `product_photo` varchar(1200) DEFAULT NULL,
  `old_price` int DEFAULT NULL,
  `new_price` int DEFAULT NULL,
  `price_difference` int DEFAULT NULL,
  `balance_mode` varchar(255) DEFAULT NULL,
  `payment_reference` varchar(255) DEFAULT NULL,
  `refund_status` varchar(255) DEFAULT NULL,
  `refund_eligible_after` datetime(6) DEFAULT NULL,
  `wallet_credit_status` varchar(255) DEFAULT NULL,
  `bank_refund_status` varchar(255) DEFAULT NULL,
  `bank_account_holder_name` varchar(255) DEFAULT NULL,
  `bank_account_number` varchar(255) DEFAULT NULL,
  `bank_ifsc_code` varchar(255) DEFAULT NULL,
  `bank_name` varchar(255) DEFAULT NULL,
  `bank_upi_id` varchar(255) DEFAULT NULL,
  `replacement_order_id` bigint DEFAULT NULL,
  `requested_at` datetime(6) DEFAULT NULL,
  `approved_at` datetime(6) DEFAULT NULL,
  `admin_reviewed_at` datetime(6) DEFAULT NULL,
  `pickup_scheduled_at` datetime(6) DEFAULT NULL,
  `pickup_completed_at` datetime(6) DEFAULT NULL,
  `received_at` datetime(6) DEFAULT NULL,
  `refund_initiated_at` datetime(6) DEFAULT NULL,
  `refund_completed_at` datetime(6) DEFAULT NULL,
  `payment_completed_at` datetime(6) DEFAULT NULL,
  `wallet_credit_completed_at` datetime(6) DEFAULT NULL,
  `bank_refund_initiated_at` datetime(6) DEFAULT NULL,
  `bank_refund_completed_at` datetime(6) DEFAULT NULL,
  `replacement_created_at` datetime(6) DEFAULT NULL,
  `replacement_shipped_at` datetime(6) DEFAULT NULL,
  `replacement_delivered_at` datetime(6) DEFAULT NULL,
  `completed_at` datetime(6) DEFAULT NULL,
  `qc_result` varchar(255) DEFAULT NULL,
  `warehouse_proof_url` varchar(1200) DEFAULT NULL,
  `replacement_proof_url` varchar(1200) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_order_return_exchange_request_number` (`request_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_settlements` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `order_id` bigint NOT NULL,
  `payment_order_id` bigint DEFAULT NULL,
  `seller_id` bigint DEFAULT NULL,
  `order_type` varchar(32) NOT NULL,
  `settlement_status` varchar(32) NOT NULL,
  `gross_collected_amount` double DEFAULT NULL,
  `taxable_value` double DEFAULT NULL,
  `gst_amount` double DEFAULT NULL,
  `commission_amount` double DEFAULT NULL,
  `commission_gst_amount` double DEFAULT NULL,
  `tcs_rate_percentage` double DEFAULT NULL,
  `tcs_amount` double DEFAULT NULL,
  `seller_payable_amount` double DEFAULT NULL,
  `seller_gst_liability_amount` double DEFAULT NULL,
  `admin_revenue_amount` double DEFAULT NULL,
  `admin_gst_liability_amount` double DEFAULT NULL,
  `currency_code` varchar(8) DEFAULT NULL,
  `payout_reference` varchar(128) DEFAULT NULL,
  `notes` text,
  `ledger_posted_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_order_settlements_order_id` (`order_id`),
  KEY `idx_order_settlements_payment_order_id` (`payment_order_id`),
  KEY `idx_order_settlements_seller_id` (`seller_id`),
  CONSTRAINT `fk_order_settlements_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`),
  CONSTRAINT `fk_order_settlements_payment_order` FOREIGN KEY (`payment_order_id`) REFERENCES `payment_order` (`id`),
  CONSTRAINT `fk_order_settlements_seller` FOREIGN KEY (`seller_id`) REFERENCES `seller` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_tax_snapshots` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `order_id` bigint NOT NULL,
  `order_type` varchar(32) NOT NULL,
  `supplier_gstin` varchar(20) DEFAULT NULL,
  `seller_state_code` varchar(8) DEFAULT NULL,
  `pos_state_code` varchar(8) DEFAULT NULL,
  `supply_type` varchar(32) DEFAULT NULL,
  `total_taxable_value` double DEFAULT NULL,
  `total_gst_amount` double DEFAULT NULL,
  `total_amount_charged` double DEFAULT NULL,
  `total_amount_with_tax` double DEFAULT NULL,
  `total_commission_amount` double DEFAULT NULL,
  `total_commission_gst_amount` double DEFAULT NULL,
  `tcs_rate_percentage` double DEFAULT NULL,
  `tcs_amount` double DEFAULT NULL,
  `gst_rule_version` varchar(100) DEFAULT NULL,
  `tcs_rule_version` varchar(100) DEFAULT NULL,
  `snapshot_source` varchar(64) DEFAULT NULL,
  `invoice_owner` varchar(32) DEFAULT NULL,
  `liability_owner` varchar(32) DEFAULT NULL,
  `snapshot_payload` longtext,
  `frozen_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `effective_tax_date` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_order_tax_snapshots_order_id` (`order_id`),
  KEY `idx_order_tax_snapshots_order_id` (`order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orders` (
  `id` bigint NOT NULL,
  `delivery_date` datetime(6) DEFAULT NULL,
  `discount` double NOT NULL,
  `order_date` datetime(6) DEFAULT NULL,
  `order_id` varchar(255) DEFAULT NULL,
  `order_status` varchar(64) DEFAULT NULL,
  `payment_id` varchar(255) DEFAULT NULL,
  `razorpay_payment_id` varchar(255) DEFAULT NULL,
  `razorpay_payment_link_id` varchar(255) DEFAULT NULL,
  `razorpay_payment_link_reference_id` varchar(255) DEFAULT NULL,
  `razorpay_payment_link_status` varchar(255) DEFAULT NULL,
  `status` varchar(64) DEFAULT NULL,
  `payment_status` varchar(64) DEFAULT NULL,
  `seller_id` bigint DEFAULT NULL,
  `total_items` int NOT NULL,
  `total_mrp_price` double NOT NULL,
  `total_selling_price` int DEFAULT NULL,
  `shipping_address_id` bigint DEFAULT NULL,
  `user_id` bigint DEFAULT NULL,
  `cancel_reason_code` varchar(255) DEFAULT NULL,
  `cancel_reason_text` varchar(255) DEFAULT NULL,
  `cancelled_at` datetime(6) DEFAULT NULL,
  `courier_name` varchar(255) DEFAULT NULL,
  `courier_phone` varchar(255) DEFAULT NULL,
  `delivery_window_label` varchar(255) DEFAULT NULL,
  `fulfillment_status` enum('FULFILLED','IN_PROGRESS','ON_HOLD','PARTIALLY_FULFILLED','UNFULFILLED') DEFAULT NULL,
  `shipment_status` enum('DELIVERED','DELIVERY_EXCEPTION','DELIVERY_FAILED','HANDED_TO_COURIER','IN_TRANSIT','LABEL_CREATED','OUT_FOR_DELIVERY','RTO_DELIVERED','RTO_IN_TRANSIT') DEFAULT NULL,
  `payment_method` varchar(64) DEFAULT NULL,
  `payment_type` varchar(64) DEFAULT NULL,
  `provider` varchar(64) DEFAULT NULL,
  `delivered_at` datetime(6) DEFAULT NULL,
  `shipped_at` datetime(6) DEFAULT NULL,
  `coupon_code` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FKh0uue95ltjysfmkqb5abgk7tj` (`shipping_address_id`),
  KEY `idx_orders_seller_id` (`seller_id`),
  KEY `idx_orders_user_id` (`user_id`),
  CONSTRAINT `FKel9kyl84ego2otj2accfd8mr7` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`),
  CONSTRAINT `FKh0uue95ltjysfmkqb5abgk7tj` FOREIGN KEY (`shipping_address_id`) REFERENCES `address` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orders_seq` (
  `next_val` bigint DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payment_order` (
  `id` bigint NOT NULL,
  `amount` bigint DEFAULT NULL,
  `payment_link_id` varchar(255) DEFAULT NULL,
  `payment_method` varchar(64) DEFAULT NULL,
  `status` varchar(64) DEFAULT NULL,
  `user_id` bigint DEFAULT NULL,
  `gateway_name` varchar(255) DEFAULT NULL,
  `gateway_response` longtext,
  `gateway_transaction_id` varchar(255) DEFAULT NULL,
  `merchant_transaction_id` varchar(255) DEFAULT NULL,
  `payment_type` varchar(64) DEFAULT NULL,
  `provider` varchar(64) DEFAULT NULL,
  `checkout_request_id` varchar(128) DEFAULT NULL,
  `retry_count` int NOT NULL DEFAULT '0',
  `last_retry_at` datetime(6) DEFAULT NULL,
  `coupon_reservation_state` varchar(32) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_payment_order_user_checkout` (`user_id`,`checkout_request_id`),
  CONSTRAINT `FKdkj084gg4ak2uy5183lo7qu3q` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payment_order_orders` (
  `payment_order_id` bigint NOT NULL,
  `orders_id` bigint NOT NULL,
  PRIMARY KEY (`payment_order_id`,`orders_id`),
  UNIQUE KEY `UK2ujbjdd8nj7rnnybygk520rov` (`orders_id`),
  CONSTRAINT `FKc9rqjylj0f0w18f5n32stg5o7` FOREIGN KEY (`orders_id`) REFERENCES `orders` (`id`),
  CONSTRAINT `FKg5ba6n6ksqou77epbn9h6738t` FOREIGN KEY (`payment_order_id`) REFERENCES `payment_order` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payment_order_seq` (
  `next_val` bigint DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product` (
  `id` bigint NOT NULL,
  `sizes` varchar(255) DEFAULT NULL,
  `color` varchar(255) DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `description` text,
  `discount_percentage` int NOT NULL,
  `mrp_price` int NOT NULL,
  `num_ratings` int NOT NULL,
  `quantity` int NOT NULL,
  `selling_price` int NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `category_id` bigint DEFAULT NULL,
  `seller_id` bigint DEFAULT NULL,
  `size` varchar(255) DEFAULT NULL,
  `barcode` varchar(255) DEFAULT NULL,
  `brand` varchar(255) NOT NULL,
  `country_of_origin` varchar(255) DEFAULT NULL,
  `currency` enum('EUR','INR','USD') DEFAULT NULL,
  `height` double DEFAULT NULL,
  `hsn_code` varchar(255) DEFAULT NULL,
  `importer_name` varchar(255) DEFAULT NULL,
  `length` double DEFAULT NULL,
  `main_image` varchar(255) DEFAULT NULL,
  `manufacturer_address` varchar(1000) DEFAULT NULL,
  `manufacturer_name` varchar(255) DEFAULT NULL,
  `manufacturer_part_number` varchar(255) DEFAULT NULL,
  `meta_description` varchar(1000) DEFAULT NULL,
  `meta_title` varchar(255) DEFAULT NULL,
  `model_number` varchar(255) DEFAULT NULL,
  `package_type` enum('BAG','BOX','CRATE','CUSTOM','ENVELOPE') DEFAULT NULL,
  `packer_name` varchar(255) DEFAULT NULL,
  `platform_commission` double DEFAULT NULL,
  `replacement_available` bit(1) DEFAULT NULL,
  `return_window_days` int DEFAULT NULL,
  `returnable` bit(1) DEFAULT NULL,
  `safety_information` varchar(2000) DEFAULT NULL,
  `shipping_class` enum('EXPRESS','FRAGILE','HEAVY','SAME_DAY','STANDARD') DEFAULT NULL,
  `short_description` varchar(1000) DEFAULT NULL,
  `sku` varchar(255) DEFAULT NULL,
  `tax_percentage` double DEFAULT NULL,
  `thumbnail` varchar(255) DEFAULT NULL,
  `video_url` varchar(255) DEFAULT NULL,
  `warranty_period` varchar(255) DEFAULT NULL,
  `warranty_type` enum('BRAND','MANUFACTURER','NONE','SELLER') DEFAULT NULL,
  `weight` double DEFAULT NULL,
  `width` double DEFAULT NULL,
  `sub_category_id` bigint DEFAULT NULL,
  `seller_stock` int NOT NULL DEFAULT '0',
  `warehouse_stock` int NOT NULL DEFAULT '0',
  `warranty_days` int NOT NULL DEFAULT '0',
  `is_active` bit(1) NOT NULL DEFAULT b'1',
  `low_stock_threshold` int NOT NULL DEFAULT '10',
  `pricing_mode` varchar(32) DEFAULT NULL,
  `tax_class` varchar(64) DEFAULT NULL,
  `tax_rule_version` varchar(100) DEFAULT NULL,
  `cost_price` double DEFAULT NULL,
  `currency_code` varchar(8) DEFAULT NULL,
  `ui_category_key` varchar(120) DEFAULT NULL,
  `subcategory_key` varchar(120) DEFAULT NULL,
  `gender` varchar(32) DEFAULT NULL,
  `fabric_type` varchar(64) DEFAULT NULL,
  `construction_type` varchar(32) DEFAULT NULL,
  `fiber_family` varchar(64) DEFAULT NULL,
  `hsn_selection_mode` varchar(32) DEFAULT NULL,
  `suggested_hsn_code` varchar(16) DEFAULT NULL,
  `override_requested_hsn_code` varchar(16) DEFAULT NULL,
  `hsn_override_reason` text,
  `tax_review_status` varchar(32) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK1mtsbur82frn64de7balymq9s` (`category_id`),
  KEY `FK1vpv5hj9e217c52hk3k1ahmuw` (`sub_category_id`),
  KEY `idx_product_seller_id` (`seller_id`),
  CONSTRAINT `FK1mtsbur82frn64de7balymq9s` FOREIGN KEY (`category_id`) REFERENCES `category` (`id`),
  CONSTRAINT `FK1vpv5hj9e217c52hk3k1ahmuw` FOREIGN KEY (`sub_category_id`) REFERENCES `category` (`id`),
  CONSTRAINT `FKesd6fy52tk7esoo2gcls4lfe3` FOREIGN KEY (`seller_id`) REFERENCES `seller` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_gallery_images` (
  `product_id` bigint NOT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  KEY `FK7mu9ltwaca8g53jhy065rvbsr` (`product_id`),
  CONSTRAINT `FK7mu9ltwaca8g53jhy065rvbsr` FOREIGN KEY (`product_id`) REFERENCES `product` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_highlights` (
  `product_id` bigint NOT NULL,
  `highlight` varchar(255) DEFAULT NULL,
  KEY `FKporxo81u5n37cq71cxs91nxbk` (`product_id`),
  CONSTRAINT `FKporxo81u5n37cq71cxs91nxbk` FOREIGN KEY (`product_id`) REFERENCES `product` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_images` (
  `product_id` bigint NOT NULL,
  `images` varchar(255) DEFAULT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  KEY `FKi8jnqq05sk5nkma3pfp3ylqrt` (`product_id`),
  CONSTRAINT `FKi8jnqq05sk5nkma3pfp3ylqrt` FOREIGN KEY (`product_id`) REFERENCES `product` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_restock_notification_logs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `subscription_id` bigint DEFAULT NULL,
  `product_id` bigint DEFAULT NULL,
  `user_id` bigint DEFAULT NULL,
  `status` varchar(64) NOT NULL,
  `note` varchar(1200) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_restock_log_subscription` (`subscription_id`),
  KEY `fk_restock_log_product` (`product_id`),
  KEY `fk_restock_log_user` (`user_id`),
  CONSTRAINT `fk_restock_log_product` FOREIGN KEY (`product_id`) REFERENCES `product` (`id`),
  CONSTRAINT `fk_restock_log_subscription` FOREIGN KEY (`subscription_id`) REFERENCES `product_restock_subscriptions` (`id`),
  CONSTRAINT `fk_restock_log_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_restock_notification_logs_seq` (
  `next_val` bigint DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_restock_subscriptions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `product_id` bigint DEFAULT NULL,
  `user_id` bigint DEFAULT NULL,
  `status` varchar(64) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `notified_at` datetime(6) DEFAULT NULL,
  `converted_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_restock_subscription_product` (`product_id`),
  KEY `fk_restock_subscription_user` (`user_id`),
  CONSTRAINT `fk_restock_subscription_product` FOREIGN KEY (`product_id`) REFERENCES `product` (`id`),
  CONSTRAINT `fk_restock_subscription_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_restock_subscriptions_seq` (
  `next_val` bigint DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_search_keywords` (
  `product_id` bigint NOT NULL,
  `keyword` varchar(255) DEFAULT NULL,
  KEY `FKhx22npc38fnmsmdw55tkun8d5` (`product_id`),
  CONSTRAINT `FKhx22npc38fnmsmdw55tkun8d5` FOREIGN KEY (`product_id`) REFERENCES `product` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_seq` (
  `next_val` bigint DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_tags` (
  `product_id` bigint NOT NULL,
  `tag` varchar(255) DEFAULT NULL,
  KEY `FK8gmf959fnpxtkagtk56mbaj0e` (`product_id`),
  CONSTRAINT `FK8gmf959fnpxtkagtk56mbaj0e` FOREIGN KEY (`product_id`) REFERENCES `product` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_tax_reviews` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `product_id` bigint NOT NULL,
  `suggested_hsn_code` varchar(16) DEFAULT NULL,
  `requested_hsn_code` varchar(16) DEFAULT NULL,
  `override_reason` text,
  `review_status` varchar(32) NOT NULL DEFAULT 'PENDING_REVIEW',
  `reviewer_note` text,
  `requested_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `reviewed_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_product_tax_reviews_product_id` (`product_id`),
  KEY `idx_product_tax_reviews_status` (`review_status`),
  CONSTRAINT `fk_product_tax_reviews_product` FOREIGN KEY (`product_id`) REFERENCES `product` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_variant` (
  `id` bigint NOT NULL,
  `color` varchar(255) DEFAULT NULL,
  `price` int DEFAULT NULL,
  `quantity` int DEFAULT NULL,
  `size` varchar(255) DEFAULT NULL,
  `sku` varchar(255) DEFAULT NULL,
  `variant_type` varchar(255) DEFAULT NULL,
  `variant_value` varchar(255) DEFAULT NULL,
  `product_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKgrbbs9t374m9gg43l6tq1xwdj` (`product_id`),
  CONSTRAINT `FKgrbbs9t374m9gg43l6tq1xwdj` FOREIGN KEY (`product_id`) REFERENCES `product` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_variant_seq` (
  `next_val` bigint DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_variants` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `product_id` bigint DEFAULT NULL,
  `variant_type` varchar(255) DEFAULT NULL,
  `variant_value` varchar(255) DEFAULT NULL,
  `size` varchar(255) DEFAULT NULL,
  `color` varchar(255) DEFAULT NULL,
  `sku` varchar(255) DEFAULT NULL,
  `price` int DEFAULT NULL,
  `seller_stock` int DEFAULT NULL,
  `warehouse_stock` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_product_variant_product` (`product_id`),
  CONSTRAINT `fk_product_variant_product` FOREIGN KEY (`product_id`) REFERENCES `product` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `return_exchange_requests` (
  `id` bigint NOT NULL,
  `admin_comment` varchar(2000) DEFAULT NULL,
  `admin_reviewed_at` datetime(6) DEFAULT NULL,
  `completed_at` datetime(6) DEFAULT NULL,
  `customer_comment` varchar(2000) DEFAULT NULL,
  `picked_at` datetime(6) DEFAULT NULL,
  `pickup_address_snapshot` varchar(1000) DEFAULT NULL,
  `pickup_scheduled_at` datetime(6) DEFAULT NULL,
  `quantity_requested` int NOT NULL,
  `reason_code` varchar(255) NOT NULL,
  `received_at` datetime(6) DEFAULT NULL,
  `refund_completed_at` datetime(6) DEFAULT NULL,
  `refund_initiated_at` datetime(6) DEFAULT NULL,
  `rejection_reason` varchar(2000) DEFAULT NULL,
  `replacement_created_at` datetime(6) DEFAULT NULL,
  `replacement_delivered_at` datetime(6) DEFAULT NULL,
  `replacement_order_id` bigint DEFAULT NULL,
  `replacement_shipped_at` datetime(6) DEFAULT NULL,
  `request_number` varchar(255) NOT NULL,
  `request_type` enum('EXCHANGE','RETURN') NOT NULL,
  `requested_at` datetime(6) DEFAULT NULL,
  `seller_id` bigint DEFAULT NULL,
  `status` enum('EXCHANGE_APPROVED','EXCHANGE_COMPLETED','EXCHANGE_MORE_INFO_REQUESTED','EXCHANGE_PICKUP_SCHEDULED','EXCHANGE_REJECTED','EXCHANGE_REQUESTED','INSPECTION','OLD_PRODUCT_PICKED','REFUND_COMPLETED','REFUND_INITIATED','REPLACEMENT_DELIVERED','REPLACEMENT_ORDER_CREATED','REPLACEMENT_SHIPPED','RETURN_APPROVED','RETURN_MORE_INFO_REQUESTED','RETURN_PICKED','RETURN_PICKUP_SCHEDULED','RETURN_RECEIVED','RETURN_REJECTED','RETURN_REQUESTED') NOT NULL,
  `assigned_courier_id` bigint DEFAULT NULL,
  `customer_id` bigint DEFAULT NULL,
  `order_id` bigint DEFAULT NULL,
  `order_item_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKk76c62fwwk1aakfo5j05oqajw` (`request_number`),
  KEY `FK7p2i9elcc318nwlq9gicgh3f9` (`assigned_courier_id`),
  KEY `FKq383re4sus49m2jr1muhcblvk` (`customer_id`),
  KEY `FKdn3h9c12s0op8xpmsaho3wlnv` (`order_id`),
  KEY `FKg398or20una0fl5acfteii1to` (`order_item_id`),
  CONSTRAINT `FK7p2i9elcc318nwlq9gicgh3f9` FOREIGN KEY (`assigned_courier_id`) REFERENCES `couriers` (`id`),
  CONSTRAINT `FKdn3h9c12s0op8xpmsaho3wlnv` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`),
  CONSTRAINT `FKg398or20una0fl5acfteii1to` FOREIGN KEY (`order_item_id`) REFERENCES `order_item` (`id`),
  CONSTRAINT `FKq383re4sus49m2jr1muhcblvk` FOREIGN KEY (`customer_id`) REFERENCES `user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `return_exchange_requests_seq` (
  `next_val` bigint DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `return_exchange_status_history` (
  `id` bigint NOT NULL,
  `note` varchar(2000) DEFAULT NULL,
  `status` enum('EXCHANGE_APPROVED','EXCHANGE_COMPLETED','EXCHANGE_MORE_INFO_REQUESTED','EXCHANGE_PICKUP_SCHEDULED','EXCHANGE_REJECTED','EXCHANGE_REQUESTED','INSPECTION','OLD_PRODUCT_PICKED','REFUND_COMPLETED','REFUND_INITIATED','REPLACEMENT_DELIVERED','REPLACEMENT_ORDER_CREATED','REPLACEMENT_SHIPPED','RETURN_APPROVED','RETURN_MORE_INFO_REQUESTED','RETURN_PICKED','RETURN_PICKUP_SCHEDULED','RETURN_RECEIVED','RETURN_REJECTED','RETURN_REQUESTED') NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `updated_by` varchar(255) DEFAULT NULL,
  `request_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK6hn9hal99p8em744cotifijdy` (`request_id`),
  CONSTRAINT `FK6hn9hal99p8em744cotifijdy` FOREIGN KEY (`request_id`) REFERENCES `return_exchange_requests` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `return_exchange_status_history_seq` (
  `next_val` bigint DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reverse_pickup_tasks` (
  `id` bigint NOT NULL,
  `completed_at` datetime(6) DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `picked_at` datetime(6) DEFAULT NULL,
  `pickup_note` varchar(2000) DEFAULT NULL,
  `proof_url` varchar(255) DEFAULT NULL,
  `scheduled_at` datetime(6) DEFAULT NULL,
  `status` enum('ACCEPTED','CANCELLED','COMPLETED','IN_PROGRESS','PICKED','PICKUP_SCHEDULED') NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `courier_id` bigint DEFAULT NULL,
  `request_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKhrs7ld8ix4h13lc9a968e5abh` (`request_id`),
  KEY `FKdsnnjg2w6a32388gj7uei96j4` (`courier_id`),
  CONSTRAINT `FK6fy0s4ywuk1x59vnftv2yg1h7` FOREIGN KEY (`request_id`) REFERENCES `return_exchange_requests` (`id`),
  CONSTRAINT `FKdsnnjg2w6a32388gj7uei96j4` FOREIGN KEY (`courier_id`) REFERENCES `couriers` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reverse_pickup_tasks_seq` (
  `next_val` bigint DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `review` (
  `id` bigint NOT NULL,
  `create_at` datetime(6) NOT NULL,
  `rating` double NOT NULL,
  `reviewer_text` varchar(255) NOT NULL,
  `product_id` bigint DEFAULT NULL,
  `user_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FKiyof1sindb9qiqr9o8npj8klt` (`product_id`),
  KEY `FKiyf57dy48lyiftdrf7y87rnxi` (`user_id`),
  CONSTRAINT `FKiyf57dy48lyiftdrf7y87rnxi` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`),
  CONSTRAINT `FKiyof1sindb9qiqr9o8npj8klt` FOREIGN KEY (`product_id`) REFERENCES `product` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `review_product_images` (
  `review_id` bigint NOT NULL,
  `product_images` varchar(255) DEFAULT NULL,
  KEY `FKnh48ff6jnr2aym490rnn5q2ly` (`review_id`),
  CONSTRAINT `FKnh48ff6jnr2aym490rnn5q2ly` FOREIGN KEY (`review_id`) REFERENCES `review` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `review_seq` (
  `next_val` bigint DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `seller` (
  `id` bigint NOT NULL,
  `gstin` varchar(255) DEFAULT NULL,
  `account_status` varchar(64) DEFAULT NULL,
  `account_holder_name` varchar(255) DEFAULT NULL,
  `account_number` varchar(255) DEFAULT NULL,
  `ifsc_code` varchar(255) DEFAULT NULL,
  `banner` varchar(255) DEFAULT NULL,
  `business_address` varchar(255) DEFAULT NULL,
  `business_email` varchar(255) DEFAULT NULL,
  `business_mobile` varchar(255) DEFAULT NULL,
  `business_name` varchar(255) DEFAULT NULL,
  `logo` varchar(255) DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `is_email_verified` bit(1) NOT NULL,
  `mobile_number` varchar(255) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `role` varchar(32) NOT NULL,
  `seller_name` varchar(255) DEFAULT NULL,
  `pickup_address_id` bigint DEFAULT NULL,
  `bank_name` varchar(255) DEFAULT NULL,
  `business_type` varchar(64) DEFAULT NULL,
  `gst_number` varchar(255) DEFAULT NULL,
  `pan_number` varchar(255) DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `aadhaar_card_url` longtext,
  `gst_certificate_url` longtext,
  `pan_card_url` longtext,
  `primary_category` varchar(255) DEFAULT NULL,
  `store_description` longtext,
  `store_logo` longtext,
  `store_name` varchar(255) DEFAULT NULL,
  `support_email` varchar(255) DEFAULT NULL,
  `support_phone` varchar(255) DEFAULT NULL,
  `gst_registration_type` varchar(32) DEFAULT NULL,
  `gst_onboarding_policy` varchar(64) DEFAULT NULL,
  `gst_declaration_accepted` bit(1) NOT NULL DEFAULT b'0',
  `gst_compliance_status` varchar(32) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKcrgbovyy4gvgsum2yyb3fbfn7` (`email`),
  UNIQUE KEY `ux_seller_email` (`email`),
  UNIQUE KEY `UKjj970igwpuystjwkx6i5jp0o6` (`pickup_address_id`),
  CONSTRAINT `FK211igkobsc9a1ujun15vg8yd` FOREIGN KEY (`pickup_address_id`) REFERENCES `address` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `seller_report` (
  `id` bigint NOT NULL,
  `cancelled_orders` int DEFAULT NULL,
  `net_earnings` bigint DEFAULT NULL,
  `total_earnings` bigint DEFAULT NULL,
  `total_orders` int DEFAULT NULL,
  `total_refunds` bigint DEFAULT NULL,
  `total_sales` bigint DEFAULT NULL,
  `total_tax` bigint DEFAULT NULL,
  `total_transactions` int DEFAULT NULL,
  `seller_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKled1p942vldbtov2q7fp264r1` (`seller_id`),
  CONSTRAINT `FKryorwmoc988nw53yhins0xwl8` FOREIGN KEY (`seller_id`) REFERENCES `seller` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `seller_report_seq` (
  `next_val` bigint DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `seller_seq` (
  `next_val` bigint DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `settlement_ledger_entries` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `settlement_id` bigint NOT NULL,
  `order_id` bigint NOT NULL,
  `payment_order_id` bigint DEFAULT NULL,
  `seller_id` bigint DEFAULT NULL,
  `order_type` varchar(32) NOT NULL,
  `entry_group` varchar(64) NOT NULL,
  `entry_direction` varchar(16) NOT NULL,
  `account_code` varchar(64) NOT NULL,
  `account_name` varchar(128) NOT NULL,
  `amount` double NOT NULL,
  `currency_code` varchar(8) DEFAULT NULL,
  `note` text,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_settlement_ledger_entries_settlement_id` (`settlement_id`),
  KEY `idx_settlement_ledger_entries_order_id` (`order_id`),
  KEY `idx_settlement_ledger_entries_payment_order_id` (`payment_order_id`),
  KEY `idx_settlement_ledger_entries_seller_id` (`seller_id`),
  CONSTRAINT `fk_settlement_ledger_entries_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`),
  CONSTRAINT `fk_settlement_ledger_entries_payment_order` FOREIGN KEY (`payment_order_id`) REFERENCES `payment_order` (`id`),
  CONSTRAINT `fk_settlement_ledger_entries_seller` FOREIGN KEY (`seller_id`) REFERENCES `seller` (`id`),
  CONSTRAINT `fk_settlement_ledger_entries_settlement` FOREIGN KEY (`settlement_id`) REFERENCES `order_settlements` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tax_rule_versions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `rule_code` varchar(100) NOT NULL,
  `rule_type` varchar(32) NOT NULL,
  `tax_class` varchar(64) DEFAULT NULL,
  `hsn_code` varchar(16) DEFAULT NULL,
  `supply_type` varchar(32) DEFAULT NULL,
  `min_taxable_value` double DEFAULT NULL,
  `max_taxable_value` double DEFAULT NULL,
  `rate_percentage` double NOT NULL,
  `effective_from` date NOT NULL,
  `effective_to` date DEFAULT NULL,
  `published` bit(1) NOT NULL DEFAULT b'0',
  `source_reference` varchar(255) DEFAULT NULL,
  `notes` text,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `value_basis` varchar(32) DEFAULT NULL,
  `approval_status` varchar(32) DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `approved_by` varchar(120) DEFAULT NULL,
  `signed_memo_reference` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_tax_rule_versions_rule_code` (`rule_code`),
  KEY `idx_tax_rule_versions_lookup` (`rule_type`,`published`,`effective_from`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `transaction` (
  `id` bigint NOT NULL,
  `date` datetime(6) DEFAULT NULL,
  `customer_id` bigint DEFAULT NULL,
  `order_id` bigint DEFAULT NULL,
  `seller_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKpiu8sb2aby57a9iiuqe614hut` (`order_id`),
  KEY `FKq9mudodpwcab2p6kt6tyfw9nj` (`customer_id`),
  KEY `FKaaw4rl1eesbyd56wunm03tkpd` (`seller_id`),
  CONSTRAINT `FKa8ufxrrpq6xmniblly0v1rhu8` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`),
  CONSTRAINT `FKaaw4rl1eesbyd56wunm03tkpd` FOREIGN KEY (`seller_id`) REFERENCES `seller` (`id`),
  CONSTRAINT `FKq9mudodpwcab2p6kt6tyfw9nj` FOREIGN KEY (`customer_id`) REFERENCES `user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `transaction_seq` (
  `next_val` bigint DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user` (
  `id` bigint NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `full_name` varchar(255) NOT NULL,
  `mobile_number` varchar(255) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `role` enum('ROLE_ADMIN','ROLE_CUSTOMER','ROLE_SELLER') DEFAULT NULL,
  `account_status` enum('ACTIVE','BANNED','CLOSED','DEACTIVATED','PENDING_VERIFICATION','SUSPENDED') DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ux_user_email` (`email`),
  CONSTRAINT `user_chk_1` CHECK ((`role` between 0 and 2))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_addresses` (
  `user_id` bigint NOT NULL,
  `addresses_id` bigint NOT NULL,
  PRIMARY KEY (`user_id`,`addresses_id`),
  UNIQUE KEY `UKi5lp1fvgfvsplfqwu4ovwpnxs` (`addresses_id`),
  CONSTRAINT `FKfm6x520mag23hvgr1oshaut8b` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`),
  CONSTRAINT `FKth1icmttmhhorb9wiarm73i06` FOREIGN KEY (`addresses_id`) REFERENCES `address` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_seq` (
  `next_val` bigint DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_used_coupons` (
  `user_by_users_id` bigint NOT NULL,
  `used_coupons_id` bigint NOT NULL,
  PRIMARY KEY (`user_by_users_id`,`used_coupons_id`),
  KEY `FK6v6jcmjfnqrg0gesn4udodddf` (`used_coupons_id`),
  CONSTRAINT `FK6v6jcmjfnqrg0gesn4udodddf` FOREIGN KEY (`used_coupons_id`) REFERENCES `coupon` (`id`),
  CONSTRAINT `FKimolwdvn9k0ylke8d2wjfc3ys` FOREIGN KEY (`user_by_users_id`) REFERENCES `user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `verification_code` (
  `id` bigint NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `otp` varchar(255) DEFAULT NULL,
  `seller_id` bigint DEFAULT NULL,
  `user_id` bigint DEFAULT NULL,
  `attempts` int DEFAULT NULL,
  `consumed` bit(1) DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `expires_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_verification_code_user_id` (`user_id`),
  KEY `idx_verification_code_seller_id` (`seller_id`),
  KEY `idx_verification_code_email_created` (`email`,`created_at`),
  CONSTRAINT `FK6xv2fg9bam0hdm7ybw71a8x40` FOREIGN KEY (`seller_id`) REFERENCES `seller` (`id`),
  CONSTRAINT `FKgy5dhio3a6c9me7s0x9v1y4d2` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `verification_code_seq` (
  `next_val` bigint DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `warehouse_transfer_requests` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `product_id` bigint DEFAULT NULL,
  `seller_id` bigint DEFAULT NULL,
  `quantity` int NOT NULL,
  `status` varchar(64) NOT NULL,
  `seller_note` varchar(1200) DEFAULT NULL,
  `admin_note` varchar(1200) DEFAULT NULL,
  `rejection_reason` varchar(1200) DEFAULT NULL,
  `requested_at` datetime(6) NOT NULL,
  `approved_at` datetime(6) DEFAULT NULL,
  `picked_up_at` datetime(6) DEFAULT NULL,
  `received_at` datetime(6) DEFAULT NULL,
  `cancelled_at` datetime(6) DEFAULT NULL,
  `pickup_proof_url` varchar(1200) DEFAULT NULL,
  `receive_proof_url` varchar(1200) DEFAULT NULL,
  `pickup_mode` varchar(64) DEFAULT NULL,
  `estimated_weight_kg` double DEFAULT NULL,
  `package_count` int DEFAULT NULL,
  `preferred_vehicle` varchar(64) DEFAULT NULL,
  `suggested_vehicle` varchar(64) DEFAULT NULL,
  `estimated_pickup_hours` int DEFAULT NULL,
  `estimated_logistics_charge` int DEFAULT NULL,
  `package_type` varchar(64) DEFAULT NULL,
  `pickup_ready_at` datetime(6) DEFAULT NULL,
  `pickup_address_verified` bit(1) DEFAULT NULL,
  `transport_mode` varchar(64) DEFAULT NULL,
  `assigned_courier_name` varchar(255) DEFAULT NULL,
  `transporter_name` varchar(255) DEFAULT NULL,
  `invoice_number` varchar(255) DEFAULT NULL,
  `challan_number` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_warehouse_transfer_product` (`product_id`),
  KEY `fk_warehouse_transfer_seller` (`seller_id`),
  CONSTRAINT `fk_warehouse_transfer_product` FOREIGN KEY (`product_id`) REFERENCES `product` (`id`),
  CONSTRAINT `fk_warehouse_transfer_seller` FOREIGN KEY (`seller_id`) REFERENCES `seller` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wishlist` (
  `id` bigint NOT NULL,
  `user_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKrcuy9aqx9c6q56x1xdoty8r3q` (`user_id`),
  CONSTRAINT `FKd4r80jm8s41fgoa0xv9yy5lo8` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wishlist_products` (
  `wishlist_id` bigint NOT NULL,
  `products_id` bigint NOT NULL,
  PRIMARY KEY (`wishlist_id`,`products_id`),
  KEY `FK6o1bb3qhyvhwmph1e48nlud0e` (`products_id`),
  CONSTRAINT `FK6o1bb3qhyvhwmph1e48nlud0e` FOREIGN KEY (`products_id`) REFERENCES `product` (`id`),
  CONSTRAINT `FKhlq0ylq5sxd70s0pembuumc1d` FOREIGN KEY (`wishlist_id`) REFERENCES `wishlist` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wishlist_seq` (
  `next_val` bigint DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;


