package com.example.ecommerce.common.configuration;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Component
public class ApiRateLimitFilter extends OncePerRequestFilter {

    private static final Set<String> RATE_LIMITED_PATHS = Set.of(
            "/api/auth/signin",
            "/api/auth/sent/login-signup-otp",
            "/sellers/login"
    );

    private final Map<String, Window> buckets = new ConcurrentHashMap<>();
    private final AtomicInteger requestCounter = new AtomicInteger(0);

    @Value("${app.rate-limit.max-requests-per-minute:30}")
    private int maxRequestsPerMinute;

    @Value("${app.rate-limit.window-seconds:60}")
    private long windowSeconds;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        if (!isRateLimitedRoute(request)) {
            filterChain.doFilter(request, response);
            return;
        }

        long now = Instant.now().getEpochSecond();
        if (requestCounter.incrementAndGet() % 100 == 0) {
            cleanupExpiredBuckets(now);
        }
        String key = request.getRemoteAddr() + ":" + request.getRequestURI();
        Window current = buckets.compute(key, (k, existing) -> {
            if (existing == null || now - existing.startEpochSecond >= windowSeconds) {
                return new Window(1, now);
            }
            existing.count += 1;
            return existing;
        });

        if (current != null && current.count > maxRequestsPerMinute) {
            response.setStatus(429);
            response.setContentType("application/json");
            response.getWriter().write("{\"message\":\"Too many requests. Please try again later.\"}");
            return;
        }

        filterChain.doFilter(request, response);
    }

    private boolean isRateLimitedRoute(HttpServletRequest request) {
        return "POST".equalsIgnoreCase(request.getMethod()) && RATE_LIMITED_PATHS.contains(request.getRequestURI());
    }

    private void cleanupExpiredBuckets(long nowEpochSeconds) {
        buckets.entrySet().removeIf(
                entry -> nowEpochSeconds - entry.getValue().startEpochSecond >= windowSeconds
        );
    }

    private static class Window {
        private int count;
        private long startEpochSecond;

        private Window(int count, long startEpochSecond) {
            this.count = count;
            this.startEpochSecond = startEpochSecond;
        }
    }
}




