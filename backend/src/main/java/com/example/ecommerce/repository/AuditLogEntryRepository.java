package com.example.ecommerce.repository;

import com.example.ecommerce.modal.AuditLogEntry;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuditLogEntryRepository extends JpaRepository<AuditLogEntry, Long> {
}
