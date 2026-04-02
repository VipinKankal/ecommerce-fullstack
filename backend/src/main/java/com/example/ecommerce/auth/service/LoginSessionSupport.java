package com.example.ecommerce.auth.service;

import com.example.ecommerce.common.domain.UserRole;
import io.jsonwebtoken.Claims;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.core.GrantedAuthority;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Collection;
import java.util.UUID;

final class LoginSessionSupport {

    private LoginSessionSupport() {
    }

    static UserRole resolvePrimaryRole(Collection<? extends GrantedAuthority> authorities) {
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

    static UserRole resolveRole(String authorities) {
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

    static String resolveDeviceKey(HttpServletRequest request) {
        String headerDevice = readHeader(request, "X-Device-Id");
        if (headerDevice != null && !headerDevice.isBlank()) {
            return "hdr:" + truncate(headerDevice.trim(), 120);
        }
        String raw = (readHeader(request, "User-Agent") == null ? "unknown" : readHeader(request, "User-Agent"))
                + "|"
                + (resolveClientIp(request) == null ? "unknown" : resolveClientIp(request));
        return "fp:" + sha256Prefix(raw, 24);
    }

    static String resolveDeviceLabel(HttpServletRequest request) {
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

    static String resolveClientIp(HttpServletRequest request) {
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

    static String readHeader(HttpServletRequest request, String name) {
        if (request == null || name == null || name.isBlank()) {
            return null;
        }
        String value = request.getHeader(name);
        return value == null || value.isBlank() ? null : value.trim();
    }

    static String normalizeEmail(String email) {
        if (email == null) {
            return null;
        }
        String normalized = email.trim().toLowerCase();
        return normalized.isBlank() ? null : normalized;
    }

    static String truncate(String value, int maxLength) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        if (trimmed.length() <= maxLength) {
            return trimmed;
        }
        return trimmed.substring(0, maxLength);
    }

    static String sha256Prefix(String value, int hexChars) {
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

    static String stringify(Object value) {
        return value == null ? null : String.valueOf(value);
    }

    static String resolveSessionId(Claims claims) {
        return claims == null ? null : stringify(claims.get("sid"));
    }

    static String resolvePrincipalEmail(Claims claims) {
        return claims == null ? null : normalizeEmail(stringify(claims.get("email")));
    }

    static UserRole resolvePrincipalRole(Claims claims) {
        return claims == null ? null : resolveRole(stringify(claims.get("authorities")));
    }
}
