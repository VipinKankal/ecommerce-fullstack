package com.example.ecommerce.common.configuration;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import java.util.Arrays;

@Component
public class StartupSecurityValidator {

    private final Environment environment;

    @Value("${app.jwt.secret:}")
    private String jwtSecret;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    @Value("${spring.mail.password:}")
    private String mailPassword;

    public StartupSecurityValidator(Environment environment) {
        this.environment = environment;
    }

    @PostConstruct
    void validateProductionSecrets() {
        boolean prodProfile = Arrays.stream(environment.getActiveProfiles())
                .anyMatch(profile -> "prod".equalsIgnoreCase(profile));
        if (!prodProfile) {
            return;
        }

        if (jwtSecret == null || jwtSecret.length() < 64 || jwtSecret.contains("jfdhjhdfngfghkfg")) {
            throw new IllegalStateException("Invalid JWT secret for prod profile. Set strong JWT_SECRET_KEY.");
        }

        if (isBlank(mailUsername) || isBlank(mailPassword)) {
            throw new IllegalStateException("MAIL_USERNAME and MAIL_PASSWORD are required in prod profile.");
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }
}




