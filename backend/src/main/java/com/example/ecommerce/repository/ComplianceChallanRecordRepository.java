package com.example.ecommerce.repository;

import com.example.ecommerce.modal.ComplianceChallanRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ComplianceChallanRecordRepository extends JpaRepository<ComplianceChallanRecord, Long> {
    List<ComplianceChallanRecord> findAllByOrderByPaidAtDescCreatedAtDesc();
}