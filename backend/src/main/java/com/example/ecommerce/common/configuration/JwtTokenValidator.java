package com.example.ecommerce.common.configuration;

import com.example.ecommerce.common.response.ApiEnvelopeFactory;
import com.example.ecommerce.common.response.ApiErrorCode;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

public class JwtTokenValidator extends OncePerRequestFilter {
    private final JwtProvider jwtProvider;
    private final ApiResponseWriter apiResponseWriter;

    public JwtTokenValidator(JwtProvider jwtProvider, ApiResponseWriter apiResponseWriter) {
        this.jwtProvider = jwtProvider;
        this.apiResponseWriter = apiResponseWriter;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        String jwt = request.getHeader("Authorization");

        if (jwt != null) {
            if (!jwt.startsWith("Bearer ")) {
                SecurityContextHolder.clearContext();
                apiResponseWriter.writeError(
                        response,
                        org.springframework.http.HttpStatus.UNAUTHORIZED,
                        "Authorization header must use a Bearer token.",
                        ApiErrorCode.AUTH_REQUIRED,
                        ApiEnvelopeFactory.buildPathDetails(request.getRequestURI())
                );
                return;
            }

            try {
                Claims claims = jwtProvider.parseToken(jwt.substring(7));
                String email = String.valueOf(claims.get("email"));
                String authorities = String.valueOf(claims.get("authorities"));

                List<GrantedAuthority> auths =
                        AuthorityUtils.commaSeparatedStringToAuthorityList(authorities);
                Authentication authentication =
                        new UsernamePasswordAuthenticationToken(email, null, auths);
                SecurityContextHolder.getContext().setAuthentication(authentication);
            } catch (Exception e) {
                SecurityContextHolder.clearContext();
                apiResponseWriter.writeError(
                        response,
                        org.springframework.http.HttpStatus.UNAUTHORIZED,
                        "Invalid or expired authentication token.",
                        ApiErrorCode.AUTH_REQUIRED,
                        ApiEnvelopeFactory.buildPathDetails(request.getRequestURI())
                );
                return;
            }
        }

        filterChain.doFilter(request, response);
    }
}




