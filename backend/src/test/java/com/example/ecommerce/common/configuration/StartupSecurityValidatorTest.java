package com.example.ecommerce.common.configuration;

import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class StartupSecurityValidatorTest {

    @Test
    void validateProductionSecrets_shouldFailWhenCookieSecureIsFalseInProd() {
        MockEnvironment environment = new MockEnvironment();
        environment.setActiveProfiles("prod");

        StartupSecurityValidator validator = new StartupSecurityValidator(environment);
        ReflectionTestUtils.setField(validator, "jwtSecret", "012345678901234567890123456789012345678901234567890123456789abcd");
        ReflectionTestUtils.setField(validator, "mailUsername", "prod@example.com");
        ReflectionTestUtils.setField(validator, "mailPassword", "prod-password");
        ReflectionTestUtils.setField(validator, "authCookieSecure", false);

        IllegalStateException exception = assertThrows(IllegalStateException.class, validator::validateProductionSecrets);
        assertTrue(exception.getMessage().contains("app.auth.cookie.secure must be true"));
    }

    @Test
    void validateProductionSecrets_shouldPassWhenCookieSecureIsTrueInProd() {
        MockEnvironment environment = new MockEnvironment();
        environment.setActiveProfiles("prod");

        StartupSecurityValidator validator = new StartupSecurityValidator(environment);
        ReflectionTestUtils.setField(validator, "jwtSecret", "012345678901234567890123456789012345678901234567890123456789abcd");
        ReflectionTestUtils.setField(validator, "mailUsername", "prod@example.com");
        ReflectionTestUtils.setField(validator, "mailPassword", "prod-password");
        ReflectionTestUtils.setField(validator, "authCookieSecure", true);

        assertDoesNotThrow(validator::validateProductionSecrets);
    }
}

