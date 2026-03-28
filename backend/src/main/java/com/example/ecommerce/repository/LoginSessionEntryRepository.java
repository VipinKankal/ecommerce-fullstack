package com.example.ecommerce.repository;

import com.example.ecommerce.common.domain.UserRole;
import com.example.ecommerce.modal.LoginSessionEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface LoginSessionEntryRepository extends JpaRepository<LoginSessionEntry, Long> {

    Optional<LoginSessionEntry> findBySessionId(String sessionId);

    Optional<LoginSessionEntry> findTopByPrincipalEmailAndPrincipalRoleAndLoggedOutAtIsNullOrderByLoginAtDesc(
            String principalEmail,
            UserRole principalRole
    );

    List<LoginSessionEntry> findTop10ByPrincipalEmailAndPrincipalRoleOrderByLoginAtDesc(
            String principalEmail,
            UserRole principalRole
    );

    @Query("""
            select count(distinct entry.deviceKey)
            from LoginSessionEntry entry
            where entry.principalEmail = :principalEmail
              and entry.principalRole = :principalRole
              and entry.loggedOutAt is null
              and entry.tokenExpiresAt > :now
            """)
    long countActiveDevices(
            @Param("principalEmail") String principalEmail,
            @Param("principalRole") UserRole principalRole,
            @Param("now") LocalDateTime now
    );
}
