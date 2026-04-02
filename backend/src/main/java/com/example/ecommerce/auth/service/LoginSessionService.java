package com.example.ecommerce.auth.service;

import com.example.ecommerce.common.configuration.JwtProvider;
import com.example.ecommerce.common.domain.UserRole;
import com.example.ecommerce.common.response.LoginHistoryEntryResponse;
import com.example.ecommerce.common.response.LoginHistorySummaryResponse;
import com.example.ecommerce.modal.LoginSessionEntry;
import com.example.ecommerce.repository.LoginSessionEntryRepository;
import io.jsonwebtoken.Claims;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class LoginSessionService {

    private final LoginSessionEntryRepository loginSessionEntryRepository;
    private final JwtProvider jwtProvider;

    @Value("${app.jwt.expiration-ms:86400000}")
    private long jwtExpirationMs;

    @Transactional
    public String openSession(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return null;
        }
        UserRole role = LoginSessionSupport.resolvePrimaryRole(authentication.getAuthorities());
        if (role == null) {
            return null;
        }

        HttpServletRequest request = currentRequest();
        LocalDateTime now = LocalDateTime.now();

        LoginSessionEntry entry = new LoginSessionEntry();
        entry.setSessionId(UUID.randomUUID().toString());
        entry.setPrincipalEmail(LoginSessionSupport.normalizeEmail(authentication.getName()));
        entry.setPrincipalRole(role);
        entry.setDeviceKey(LoginSessionSupport.resolveDeviceKey(request));
        entry.setDeviceLabel(LoginSessionSupport.resolveDeviceLabel(request));
        entry.setIpAddress(LoginSessionSupport.resolveClientIp(request));
        entry.setUserAgent(LoginSessionSupport.truncate(LoginSessionSupport.readHeader(request, "User-Agent"), 512));
        entry.setLoginAt(now);
        entry.setTokenExpiresAt(now.plus(Duration.ofMillis(Math.max(jwtExpirationMs, 60000L))));
        loginSessionEntryRepository.save(entry);

        return entry.getSessionId();
    }

    @Transactional
    public void markLoggedOut(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            return;
        }
        try {
            Claims claims = jwtProvider.parseToken(rawToken.trim());
            String sessionId = LoginSessionSupport.resolveSessionId(claims);
            if (sessionId != null && !sessionId.isBlank()) {
                markLoggedOutBySessionId(sessionId);
                return;
            }

            String principalEmail = LoginSessionSupport.resolvePrincipalEmail(claims);
            UserRole role = LoginSessionSupport.resolvePrincipalRole(claims);
            if (principalEmail == null || role == null) {
                return;
            }

            loginSessionEntryRepository
                    .findTopByPrincipalEmailAndPrincipalRoleAndLoggedOutAtIsNullOrderByLoginAtDesc(principalEmail, role)
                    .ifPresent(this::markLoggedOutEntry);
        } catch (Exception ignored) {
        }
    }

    @Transactional(readOnly = true)
    public LoginHistorySummaryResponse getLoginHistory(String principalEmail, UserRole role) {
        LoginHistorySummaryResponse summary = new LoginHistorySummaryResponse();
        if (principalEmail == null || principalEmail.isBlank() || role == null) {
            return summary;
        }

        String normalizedEmail = LoginSessionSupport.normalizeEmail(principalEmail);
        LocalDateTime now = LocalDateTime.now();
        long activeDevices = loginSessionEntryRepository.countActiveDevices(normalizedEmail, role, now);

        summary.setActiveDeviceCount((int) Math.min(activeDevices, Integer.MAX_VALUE));
        summary.setLoginHistory(
                loginSessionEntryRepository
                        .findTop10ByPrincipalEmailAndPrincipalRoleOrderByLoginAtDesc(normalizedEmail, role)
                        .stream()
                        .map(entry -> toResponse(entry, now))
                        .toList()
        );
        return summary;
    }

    public String currentSessionId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) {
            return null;
        }
        Object details = authentication.getDetails();
        if (!(details instanceof Map<?, ?> map)) {
            return null;
        }
        Object value = map.get("sessionId");
        return value == null ? null : value.toString();
    }

    private void markLoggedOutBySessionId(String sessionId) {
        Optional<LoginSessionEntry> entry = loginSessionEntryRepository.findBySessionId(sessionId);
        entry.ifPresent(this::markLoggedOutEntry);
    }

    private void markLoggedOutEntry(LoginSessionEntry entry) {
        if (entry.getLoggedOutAt() != null) {
            return;
        }
        entry.setLoggedOutAt(LocalDateTime.now());
        loginSessionEntryRepository.save(entry);
    }

    private LoginHistoryEntryResponse toResponse(LoginSessionEntry entry, LocalDateTime now) {
        LoginHistoryEntryResponse response = new LoginHistoryEntryResponse();
        response.setDevice(entry.getDeviceLabel());
        response.setIpAddress(entry.getIpAddress());
        response.setLoginAt(entry.getLoginAt());
        response.setLogoutAt(entry.getLoggedOutAt());
        response.setActive(entry.getLoggedOutAt() == null && entry.getTokenExpiresAt() != null && entry.getTokenExpiresAt().isAfter(now));
        return response;
    }

    private HttpServletRequest currentRequest() {
        try {
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            return attributes == null ? null : attributes.getRequest();
        } catch (Exception exception) {
            return null;
        }
    }
}
