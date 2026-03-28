package com.example.ecommerce.common.configuration;

import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class JwtProviderTest {

    @Test
    void init_shouldFailWhenProdProfileAndSecretMissing() {
        MockEnvironment environment = new MockEnvironment();
        environment.setActiveProfiles("prod");

        JwtProvider provider = new JwtProvider(environment);
        ReflectionTestUtils.setField(provider, "jwtSecret", "   ");

        IllegalStateException exception = assertThrows(IllegalStateException.class, provider::init);
        assertTrue(exception.getMessage().contains("JWT secret is required in prod profile"));
    }

    @Test
    void init_shouldAllowEphemeralSecretOutsideProd() {
        MockEnvironment environment = new MockEnvironment();
        environment.setActiveProfiles("default");

        JwtProvider provider = new JwtProvider(environment);
        ReflectionTestUtils.setField(provider, "jwtSecret", "");

        provider.init();

        assertNotNull(ReflectionTestUtils.getField(provider, "key"));
    }
}

