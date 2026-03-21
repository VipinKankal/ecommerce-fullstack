package com.example.ecommerce.common.configuration;

import com.example.ecommerce.common.response.ApiEnvelopeFactory;
import com.example.ecommerce.common.response.ApiErrorCode;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class ApiAccessDeniedHandler implements AccessDeniedHandler {

    private final ApiResponseWriter apiResponseWriter;

    @Override
    public void handle(
            HttpServletRequest request,
            HttpServletResponse response,
            AccessDeniedException accessDeniedException
    ) throws IOException, ServletException {
        apiResponseWriter.writeError(
                response,
                HttpStatus.FORBIDDEN,
                "You do not have permission to access this resource.",
                ApiErrorCode.ACCESS_DENIED,
                ApiEnvelopeFactory.buildPathDetails(request.getRequestURI())
        );
    }
}
