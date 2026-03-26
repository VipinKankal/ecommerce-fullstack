package com.example.ecommerce.repository;

import com.example.ecommerce.modal.HsnMasterRule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface HsnMasterRuleRepository extends JpaRepository<HsnMasterRule, Long> {
    Optional<HsnMasterRule> findByRuleCodeIgnoreCase(String ruleCode);

    List<HsnMasterRule> findByUiCategoryKeyIgnoreCaseAndPublishedTrueAndEffectiveFromLessThanEqual(
            String uiCategoryKey,
            LocalDate effectiveDate
    );
}
