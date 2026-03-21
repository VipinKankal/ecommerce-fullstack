package com.example.ecommerce.common.configuration;

import com.example.ecommerce.common.response.ApiEnvelopeFactory;
import com.example.ecommerce.common.response.ApiErrorCode;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class ApiResponseWriter {

    private final ObjectMapper objectMapper;

    public void writeError(
            HttpServletResponse response,
            HttpStatus status,
            String message,
            ApiErrorCode code,
            Object details
    ) throws IOException {
        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        objectMapper.writeValue(
                response.getWriter(),
                ApiEnvelopeFactory.error(status, message, code, details)
        );
    }
}
