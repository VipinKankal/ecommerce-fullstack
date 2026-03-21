package com.example.ecommerce.common.response;

import lombok.RequiredArgsConstructor;
import org.springframework.core.MethodParameter;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpResponse;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.mvc.method.annotation.ResponseBodyAdvice;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;

@RestControllerAdvice
@RequiredArgsConstructor
public class ApiEnvelopeAdvice implements ResponseBodyAdvice<Object> {

    private final ObjectMapper objectMapper;

    @Override
    public boolean supports(MethodParameter returnType, Class<? extends HttpMessageConverter<?>> converterType) {
        return true;
    }

    @Override
    public Object beforeBodyWrite(
            Object body,
            MethodParameter returnType,
            MediaType selectedContentType,
            Class<? extends HttpMessageConverter<?>> selectedConverterType,
            ServerHttpRequest request,
            ServerHttpResponse response
    ) {
        if (body instanceof ApiEnvelope<?> || body instanceof Resource || body instanceof byte[]) {
            return body;
        }

        if (shouldSkip(request, selectedContentType)) {
            return body;
        }

        HttpStatus status = resolveStatus(response);
        if (status.is2xxSuccessful()) {
            ApiEnvelope<Object> envelope = ApiEnvelopeFactory.success(
                    status,
                    ApiEnvelopeFactory.resolveSuccessMessage(body, status),
                    body
            );
            return serializeIfNeeded(body, envelope);
        }

        ApiEnvelope<Void> envelope = ApiEnvelopeFactory.error(
                status,
                ApiEnvelopeFactory.resolveErrorMessage(body, status),
                ApiEnvelopeFactory.resolveErrorCode(status),
                ApiEnvelopeFactory.resolveErrorDetails(body, request.getURI().getPath())
        );
        return serializeIfNeeded(body, envelope);
    }

    private Object serializeIfNeeded(Object originalBody, Object envelope) {
        if (!(originalBody instanceof String)) {
            return envelope;
        }

        try {
            return objectMapper.writeValueAsString(envelope);
        } catch (JacksonException ex) {
            throw new IllegalStateException("Failed to serialize API envelope", ex);
        }
    }

    private boolean shouldSkip(ServerHttpRequest request, MediaType selectedContentType) {
        String path = request.getURI().getPath();
        if (path.startsWith("/v3/api-docs")
                || path.startsWith("/swagger-ui")
                || path.startsWith("/swagger-resources")) {
            return true;
        }

        if (selectedContentType == null) {
            return false;
        }

        return !MediaType.APPLICATION_JSON.includes(selectedContentType)
                && !selectedContentType.getSubtype().endsWith("+json");
    }

    private HttpStatus resolveStatus(ServerHttpResponse response) {
        if (response instanceof ServletServerHttpResponse servletResponse) {
            HttpStatus status = HttpStatus.resolve(servletResponse.getServletResponse().getStatus());
            if (status != null) {
                return status;
            }
        }
        return HttpStatus.OK;
    }
}
