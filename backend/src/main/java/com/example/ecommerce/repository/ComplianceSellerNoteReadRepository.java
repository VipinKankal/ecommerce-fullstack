package com.example.ecommerce.repository;

import com.example.ecommerce.modal.ComplianceSellerNoteRead;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface ComplianceSellerNoteReadRepository extends JpaRepository<ComplianceSellerNoteRead, Long> {
    Optional<ComplianceSellerNoteRead> findBySeller_IdAndNote_Id(Long sellerId, Long noteId);

    List<ComplianceSellerNoteRead> findBySeller_IdAndNote_IdIn(Long sellerId, Collection<Long> noteIds);

    List<ComplianceSellerNoteRead> findByNote_IdIn(Collection<Long> noteIds);

    long countBySeller_IdAndAcknowledgedTrue(Long sellerId);
}

