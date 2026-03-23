package com.example.ecommerce.common.configuration;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Service
public class AuthCookieService {

    @Value("${app.auth.cookie.name:ECOM_AUTH}")
    private String cookieName;

    @Value("${app.auth.cookie.path:/}")
    private String cookiePath;

    @Value("${app.auth.cookie.secure:false}")
    private boolean secureCookie;

    @Value("${app.auth.cookie.same-site:Lax}")
    private String sameSite;

    @Value("${app.jwt.expiration-ms:86400000}")
    private long jwtExpirationMs;

    public void writeAuthCookie(HttpServletResponse response, String token) {
        response.addHeader(
                HttpHeaders.SET_COOKIE,
                ResponseCookie.from(cookieName, token)
                        .httpOnly(true)
                        .secure(secureCookie)
                        .sameSite(sameSite)
                        .path(cookiePath)
                        .maxAge(Duration.ofMillis(jwtExpirationMs))
                        .build()
                        .toString()
        );
    }

    public void clearAuthCookie(HttpServletResponse response) {
        response.addHeader(
                HttpHeaders.SET_COOKIE,
                ResponseCookie.from(cookieName, "")
                        .httpOnly(true)
                        .secure(secureCookie)
                        .sameSite(sameSite)
                        .path(cookiePath)
                        .maxAge(Duration.ZERO)
                        .build()
                        .toString()
        );
    }

    public String resolveToken(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) {
            return null;
        }

        for (Cookie cookie : cookies) {
            if (cookieName.equals(cookie.getName()) && cookie.getValue() != null && !cookie.getValue().isBlank()) {
                return cookie.getValue().trim();
            }
        }
        return null;
    }
}
