package com.example.ecommerce.common.configuration;

import com.example.ecommerce.common.response.ApiEnvelopeFactory;
import com.example.ecommerce.common.response.ApiErrorCode;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Slf4j
@Component
@RequiredArgsConstructor
public class ApiRateLimitFilter extends OncePerRequestFilter {

    private static final Set<String> RATE_LIMITED_PATHS = Set.of(
            "/api/auth/signin",
            "/api/auth/sent/login-signup-otp",
            "/sellers/login",
            "/api/admin/auth/login"
    );
    private static final Set<String> FORWARDED_IP_HEADERS = Set.of(
            "X-Forwarded-For",
            "X-Real-IP",
            "CF-Connecting-IP"
    );

    private final Map<String, Window> buckets = new ConcurrentHashMap<>();
    private final AtomicInteger requestCounter = new AtomicInteger(0);
    private final AtomicBoolean redisFallbackLogged = new AtomicBoolean(false);
    private final ApiResponseWriter apiResponseWriter;
    private final ObjectProvider<StringRedisTemplate> redisTemplateProvider;

    @Value("${app.rate-limit.max-requests-per-minute:30}")
    private int maxRequestsPerMinute;

    @Value("${app.rate-limit.window-seconds:60}")
    private long windowSeconds;

    @Value("${app.rate-limit.backend:in-memory}")
    private String backend;

    @Value("${app.rate-limit.redis.key-prefix:ecommerce:rate-limit}")
    private String redisKeyPrefix;

    @Value("${app.rate-limit.trust-forwarded-ip:true}")
    private boolean trustForwardedIp;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        if (!isRateLimitedRoute(request)) {
            filterChain.doFilter(request, response);
            return;
        }

        if (maxRequestsPerMinute <= 0 || windowSeconds <= 0) {
            filterChain.doFilter(request, response);
            return;
        }

        long now = Instant.now().getEpochSecond();
        String key = buildRateLimitKey(request);
        RateLimitResult result = consumeRateLimit(key, now);

        if (!result.allowed()) {
            response.setHeader("Retry-After", String.valueOf(windowSeconds));
            LinkedHashMap<String, Object> details = new LinkedHashMap<>(
                    ApiEnvelopeFactory.buildPathDetails(request.getRequestURI())
            );
            details.put("reasonCode", "API_RATE_LIMIT_EXCEEDED");
            details.put("rateLimitBackend", result.backend());
            details.put("maxRequestsPerMinute", maxRequestsPerMinute);
            details.put("windowSeconds", windowSeconds);
            details.put("currentCount", result.currentCount());

            apiResponseWriter.writeError(
                    response,
                    HttpStatus.TOO_MANY_REQUESTS,
                    "Too many requests. Please try again later.",
                    ApiErrorCode.RATE_LIMIT_EXCEEDED,
                    details
            );
            return;
        }

        filterChain.doFilter(request, response);
    }

    private boolean isRateLimitedRoute(HttpServletRequest request) {
        return "POST".equalsIgnoreCase(request.getMethod()) && RATE_LIMITED_PATHS.contains(request.getRequestURI());
    }

    private RateLimitResult consumeRateLimit(String key, long now) {
        if ("redis".equalsIgnoreCase(backend)) {
            RateLimitResult redisResult = consumeWithRedis(key);
            if (redisResult != null) {
                return redisResult;
            }
        }
        return consumeWithInMemory(key, now, "in-memory");
    }

    private RateLimitResult consumeWithRedis(String key) {
        StringRedisTemplate redisTemplate = redisTemplateProvider.getIfAvailable();
        if (redisTemplate == null) {
            logRedisFallback("Redis backend selected but StringRedisTemplate is unavailable. Falling back to in-memory limiter.");
            return null;
        }

        try {
            String redisKey = redisKeyPrefix + ":" + key;
            Long count = redisTemplate.opsForValue().increment(redisKey);
            if (count != null && count == 1L) {
                redisTemplate.expire(redisKey, Duration.ofSeconds(windowSeconds));
            }
            long currentCount = count == null ? maxRequestsPerMinute + 1L : count;
            return new RateLimitResult(currentCount <= maxRequestsPerMinute, currentCount, "redis");
        } catch (Exception exception) {
            logRedisFallback("Redis limiter call failed. Falling back to in-memory limiter. " + exception.getMessage());
            return null;
        }
    }

    private RateLimitResult consumeWithInMemory(String key, long now, String backendName) {
        if (requestCounter.incrementAndGet() % 100 == 0) {
            cleanupExpiredBuckets(now);
        }

        Window current = buckets.compute(key, (k, existing) -> {
            if (existing == null || now - existing.startEpochSecond >= windowSeconds) {
                return new Window(1, now);
            }
            existing.count += 1;
            return existing;
        });

        int count = current == null ? maxRequestsPerMinute + 1 : current.count;
        return new RateLimitResult(count <= maxRequestsPerMinute, count, backendName);
    }

    private String buildRateLimitKey(HttpServletRequest request) {
        String ip = resolveClientIp(request);
        String method = sanitizeKeyPart(request.getMethod());
        String uri = sanitizeKeyPart(request.getRequestURI());
        return ip + ":" + method + ":" + uri;
    }

    private String resolveClientIp(HttpServletRequest request) {
        if (trustForwardedIp) {
            for (String header : FORWARDED_IP_HEADERS) {
                String candidate = firstForwardedIp(request.getHeader(header));
                if (candidate != null && !candidate.isBlank()) {
                    return sanitizeKeyPart(candidate);
                }
            }
        }
        return sanitizeKeyPart(request.getRemoteAddr());
    }

    private String firstForwardedIp(String headerValue) {
        if (headerValue == null || headerValue.isBlank()) {
            return null;
        }
        int commaIndex = headerValue.indexOf(',');
        String primary = commaIndex >= 0 ? headerValue.substring(0, commaIndex) : headerValue;
        return primary.trim();
    }

    private String sanitizeKeyPart(String value) {
        if (value == null || value.isBlank()) {
            return "unknown";
        }
        return value.replaceAll("[^a-zA-Z0-9:._/-]", "_");
    }

    private void logRedisFallback(String message) {
        if (redisFallbackLogged.compareAndSet(false, true)) {
            log.warn(message);
        }
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

    private record RateLimitResult(boolean allowed, long currentCount, String backend) {
    }
}




