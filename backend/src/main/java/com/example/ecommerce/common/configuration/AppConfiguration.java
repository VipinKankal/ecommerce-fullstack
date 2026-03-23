package com.example.ecommerce.common.configuration;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.web.config.EnableSpringDataWebSupport;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.www.BasicAuthenticationFilter;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfFilter;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@EnableSpringDataWebSupport(pageSerializationMode = EnableSpringDataWebSupport.PageSerializationMode.VIA_DTO)
public class AppConfiguration {

    @Value("${app.cors.allowed-origins:http://localhost:3000}")
    private String allowedOrigins;

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            JwtTokenValidator jwtTokenValidator,
            ApiRateLimitFilter apiRateLimitFilter,
            AuditLoggingFilter auditLoggingFilter,
            CsrfCookieFilter csrfCookieFilter,
            ApiAuthenticationEntryPoint apiAuthenticationEntryPoint,
            ApiAccessDeniedHandler apiAccessDeniedHandler
    ) throws Exception {

        CookieCsrfTokenRepository csrfTokenRepository = CookieCsrfTokenRepository.withHttpOnlyFalse();
        csrfTokenRepository.setCookieName("XSRF-TOKEN");
        csrfTokenRepository.setHeaderName("X-CSRF-Token");
        csrfTokenRepository.setCookiePath("/");

        http.sessionManagement(management ->
                        management.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(authorize -> authorize
                        .requestMatchers(
                                "/api/auth/signup",
                                "/api/auth/signin",
                                "/api/auth/logout",
                                "/api/auth/sent/login-signup-otp",
                                "/api/admin/auth/login",
                                "/api/payment/phonepe/webhook"
                        ).permitAll()
                        .requestMatchers(
                                "/products/**",
                                "/api/product/*/reviews",
                                "/api/products/*/reviews",
                                "/sellers",
                                "/sellers/verifyEmail/**",
                                "/sellers/login"
                        ).permitAll()
                        .requestMatchers(
                                "/api/seller/*/status/**",
                                "/api/admin/**",
                                "/admin/**",
                                "/api/coupons/admin/**",
                                "/home/categories",
                                "/admin/home-category/**"
                        ).hasRole("ADMIN")
                        .requestMatchers("/api/**").authenticated()
                        .anyRequest().permitAll()

                ).addFilterBefore(apiRateLimitFilter, BasicAuthenticationFilter.class)
                .addFilterBefore(jwtTokenValidator, BasicAuthenticationFilter.class)
                .addFilterAfter(csrfCookieFilter, CsrfFilter.class)
                .addFilterAfter(auditLoggingFilter, BasicAuthenticationFilter.class)
                .exceptionHandling(exceptionHandling -> exceptionHandling
                        .authenticationEntryPoint(apiAuthenticationEntryPoint)
                        .accessDeniedHandler(apiAccessDeniedHandler)
                )
                .csrf(csrf -> csrf
                        .csrfTokenRepository(csrfTokenRepository)
                        .ignoringRequestMatchers(
                                "/api/auth/signup",
                                "/api/auth/signin",
                                "/api/auth/logout",
                                "/api/auth/sent/login-signup-otp",
                                "/api/admin/auth/login",
                                "/api/payment/phonepe/webhook",
                                "/sellers",
                                "/sellers/login",
                                "/sellers/verifyEmail/**"
                        )
                )
                .cors(cors -> cors.configurationSource(corsConfigurationSource()));
        return http.build();
    }

    @Bean
    public JwtTokenValidator jwtTokenValidator(
            JwtProvider jwtProvider,
            ApiResponseWriter apiResponseWriter,
            AuthCookieService authCookieService
    ) {
        return new JwtTokenValidator(jwtProvider, apiResponseWriter, authCookieService);
    }

    private CorsConfigurationSource corsConfigurationSource() {
        return new CorsConfigurationSource() {

            @Override
            public CorsConfiguration getCorsConfiguration(HttpServletRequest request) {
                CorsConfiguration config = new CorsConfiguration();
                List<String> origins = Arrays.stream(allowedOrigins.split(","))
                        .map(String::trim)
                        .filter(value -> !value.isEmpty())
                        .collect(Collectors.toList());

                config.setAllowedHeaders(Arrays.asList(
                        "Authorization",
                        "Content-Type",
                        "X-Requested-With",
                        "X-CSRF-Token"
                ));
                config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
                config.setAllowedOrigins(origins);
                config.setAllowCredentials(true);
                config.setExposedHeaders(List.of("Authorization"));
                config.setMaxAge(3600L);
                return config;
            }

        };
    }

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}
