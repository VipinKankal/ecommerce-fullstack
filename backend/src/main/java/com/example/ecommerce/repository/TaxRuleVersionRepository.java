package com.example.ecommerce.repository;

import com.example.ecommerce.modal.TaxRuleVersion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface TaxRuleVersionRepository extends JpaRepository<TaxRuleVersion, Long> {
    Optional<TaxRuleVersion> findByRuleCodeIgnoreCase(String ruleCode);

    List<TaxRuleVersion> findByRuleTypeIgnoreCaseAndPublishedTrueAndEffectiveFromLessThanEqual(
            String ruleType,
            LocalDate effectiveDate
    );
}
