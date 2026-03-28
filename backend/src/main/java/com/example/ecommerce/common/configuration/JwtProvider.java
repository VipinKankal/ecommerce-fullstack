package com.example.ecommerce.common.configuration;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Arrays;
import java.util.Base64;
import java.util.Collection;
import java.util.Date;
import java.util.HashSet;
import java.util.Set;

@Service
public class JwtProvider {
    private static final Logger log = LoggerFactory.getLogger(JwtProvider.class);
    private final Environment environment;

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    @Value("${app.jwt.expiration-ms:86400000}")
    private long jwtExpirationMs;

    private SecretKey key;

    public JwtProvider(Environment environment) {
        this.environment = environment;
    }

    @PostConstruct
    void init() {
        String effectiveSecret = jwtSecret;
        boolean prodProfile = Arrays.stream(environment.getActiveProfiles())
                .anyMatch(profile -> "prod".equalsIgnoreCase(profile));

        if (effectiveSecret == null || effectiveSecret.trim().isEmpty()) {
            if (prodProfile) {
                throw new IllegalStateException("JWT secret is required in prod profile. Set JWT_SECRET_KEY.");
            }
            byte[] randomBytes = new byte[64];
            new SecureRandom().nextBytes(randomBytes);
            effectiveSecret = Base64.getEncoder().encodeToString(randomBytes);
            log.warn("JWT secret not set. Generated an ephemeral in-memory secret for current process.");
        }
        this.key = Keys.hmacShaKeyFor(effectiveSecret.getBytes(StandardCharsets.UTF_8));
    }

    public String generateToken(Authentication authentication) {
        return generateToken(authentication, null);
    }

    public String generateToken(Authentication authentication, String sessionId) {
        Collection<? extends GrantedAuthority> authorities = authentication.getAuthorities();
        String roles = populationsAuthorities(authorities);

        var builder = Jwts.builder()
                .setIssuedAt(new Date())
                .setExpiration(new Date(new Date().getTime() + jwtExpirationMs))
                .claim("email", authentication.getName())
                .claim("authorities", roles);

        if (sessionId != null && !sessionId.isBlank()) {
            builder.claim("sid", sessionId);
        }

        return builder
                .signWith(key)
                .compact();

    }

    public String getEmailFromToken(String jwt) {
        if (jwt == null || !jwt.startsWith("Bearer ")) {
            throw new IllegalArgumentException("Invalid Authorization header");
        }
        jwt = jwt.substring(7);
        Claims claims = parseToken(jwt);
        return String.valueOf(claims.get("email"));
    }

    public Claims parseToken(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    private String populationsAuthorities(Collection<? extends GrantedAuthority> authorities) {
        Set<String> auths = new HashSet<>();
        for (GrantedAuthority authority : authorities) {
            auths.add(authority.getAuthority());
        }
        return String.join(",", auths);
    }
}




