package com.example.ecommerce.common.configuration;

import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
public class AuthenticatedPrincipalService {

    public String currentEmail() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null
                || !authentication.isAuthenticated()
                || authentication instanceof AnonymousAuthenticationToken) {
            throw new IllegalStateException("Authentication required");
        }

        String username = authentication.getName();
        if (username == null || username.isBlank() || "anonymousUser".equalsIgnoreCase(username)) {
            throw new IllegalStateException("Authentication required");
        }

        return username.trim().toLowerCase();
    }
}
