package com.example.ecommerce.common.configuration;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class AuditLoggingFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(AuditLoggingFilter.class);

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        long startMs = System.currentTimeMillis();
        filterChain.doFilter(request, response);

        if (!shouldAudit(request.getRequestURI())) {
            return;
        }

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String actor = (auth != null && auth.isAuthenticated()) ? auth.getName() : "anonymous";
        long durationMs = System.currentTimeMillis() - startMs;

        log.info(
                "AUDIT method={} path={} status={} actor={} ip={} durationMs={}",
                request.getMethod(),
                request.getRequestURI(),
                response.getStatus(),
                actor,
                request.getRemoteAddr(),
                durationMs
        );
    }

    private boolean shouldAudit(String uri) {
        return uri.startsWith("/api/") || uri.startsWith("/sellers");
    }
}




