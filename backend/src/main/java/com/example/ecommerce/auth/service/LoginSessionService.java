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
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Collection;
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
        UserRole role = resolvePrimaryRole(authentication.getAuthorities());
        if (role == null) {
            return null;
        }

        HttpServletRequest request = currentRequest();
        LocalDateTime now = LocalDateTime.now();

        LoginSessionEntry entry = new LoginSessionEntry();
        entry.setSessionId(UUID.randomUUID().toString());
        entry.setPrincipalEmail(normalizeEmail(authentication.getName()));
        entry.setPrincipalRole(role);
        entry.setDeviceKey(resolveDeviceKey(request));
        entry.setDeviceLabel(resolveDeviceLabel(request));
        entry.setIpAddress(resolveClientIp(request));
        entry.setUserAgent(truncate(readHeader(request, "User-Agent"), 512));
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
            String sessionId = stringify(claims.get("sid"));
            if (sessionId != null && !sessionId.isBlank()) {
                markLoggedOutBySessionId(sessionId);
                return;
            }

            String principalEmail = normalizeEmail(stringify(claims.get("email")));
            UserRole role = resolveRole(stringify(claims.get("authorities")));
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

        String normalizedEmail = normalizeEmail(principalEmail);
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
        response.setActive(
                entry.getLoggedOutAt() == null
                        && entry.getTokenExpiresAt() != null
                        && entry.getTokenExpiresAt().isAfter(now)
        );
        return response;
    }

    private HttpServletRequest currentRequest() {
        try {
            ServletRequestAttributes attributes =
                    (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            return attributes == null ? null : attributes.getRequest();
        } catch (Exception exception) {
            return null;
        }
    }

    private UserRole resolvePrimaryRole(Collection<? extends GrantedAuthority> authorities) {
        if (authorities == null || authorities.isEmpty()) {
            return null;
        }
        for (GrantedAuthority authority : authorities) {
            UserRole role = resolveRole(authority == null ? null : authority.getAuthority());
            if (role != null) {
                return role;
            }
        }
        return null;
    }

    private UserRole resolveRole(String authorities) {
        if (authorities == null || authorities.isBlank()) {
            return null;
        }
        String[] values = authorities.split(",");
        for (String value : values) {
            String normalized = value == null ? "" : value.trim().toUpperCase();
            if (normalized.isEmpty()) {
                continue;
            }
            try {
                return UserRole.valueOf(normalized);
            } catch (IllegalArgumentException ignored) {
            }
        }
        return null;
    }

    private String resolveDeviceKey(HttpServletRequest request) {
        String headerDevice = readHeader(request, "X-Device-Id");
        if (headerDevice != null && !headerDevice.isBlank()) {
            return "hdr:" + truncate(headerDevice.trim(), 120);
        }
        String raw = (readHeader(request, "User-Agent") == null ? "unknown" : readHeader(request, "User-Agent"))
                + "|"
                + (resolveClientIp(request) == null ? "unknown" : resolveClientIp(request));
        return "fp:" + sha256Prefix(raw, 24);
    }

    private String resolveDeviceLabel(HttpServletRequest request) {
        String headerDevice = readHeader(request, "X-Device-Id");
        if (headerDevice != null && !headerDevice.isBlank()) {
            String normalized = headerDevice.trim();
            if (normalized.length() <= 20) {
                return "Device " + normalized;
            }
            return "Device " + normalized.substring(Math.max(0, normalized.length() - 20));
        }

        String userAgent = readHeader(request, "User-Agent");
        if (userAgent == null || userAgent.isBlank()) {
            return "Unknown Device";
        }
        String ua = userAgent.toLowerCase();
        String os = "Unknown OS";
        if (ua.contains("android")) {
            os = "Android";
        } else if (ua.contains("iphone") || ua.contains("ipad") || ua.contains("ios")) {
            os = "iOS";
        } else if (ua.contains("windows")) {
            os = "Windows";
        } else if (ua.contains("mac os")) {
            os = "macOS";
        } else if (ua.contains("linux")) {
            os = "Linux";
        }

        String browser = "Browser";
        if (ua.contains("edg/")) {
            browser = "Edge";
        } else if (ua.contains("firefox/")) {
            browser = "Firefox";
        } else if (ua.contains("chrome/")) {
            browser = "Chrome";
        } else if (ua.contains("safari/")) {
            browser = "Safari";
        }
        return browser + " on " + os;
    }

    private String resolveClientIp(HttpServletRequest request) {
        String forwardedFor = readHeader(request, "X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            String first = forwardedFor.split(",")[0].trim();
            if (!first.isBlank()) {
                return truncate(first, 64);
            }
        }
        String realIp = readHeader(request, "X-Real-IP");
        if (realIp != null && !realIp.isBlank()) {
            return truncate(realIp.trim(), 64);
        }
        return request == null ? null : truncate(request.getRemoteAddr(), 64);
    }

    private String readHeader(HttpServletRequest request, String name) {
        if (request == null || name == null || name.isBlank()) {
            return null;
        }
        String value = request.getHeader(name);
        return value == null || value.isBlank() ? null : value.trim();
    }

    private String normalizeEmail(String email) {
        if (email == null) {
            return null;
        }
        String normalized = email.trim().toLowerCase();
        return normalized.isBlank() ? null : normalized;
    }

    private String truncate(String value, int maxLength) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        if (trimmed.length() <= maxLength) {
            return trimmed;
        }
        return trimmed.substring(0, maxLength);
    }

    private String sha256Prefix(String value, int hexChars) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(value.getBytes(StandardCharsets.UTF_8));
            StringBuilder builder = new StringBuilder();
            for (byte b : hash) {
                builder.append(String.format("%02x", b));
                if (builder.length() >= hexChars) {
                    break;
                }
            }
            return builder.substring(0, Math.min(builder.length(), hexChars));
        } catch (Exception exception) {
            return UUID.randomUUID().toString().replace("-", "").substring(0, Math.min(24, hexChars));
        }
    }

    private String stringify(Object value) {
        return value == null ? null : String.valueOf(value);
    }
}
