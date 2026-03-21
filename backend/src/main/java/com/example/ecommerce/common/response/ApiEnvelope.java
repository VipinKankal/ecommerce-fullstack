package com.example.ecommerce.common.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ApiEnvelope<T> {
    private boolean success;
    private int status;
    private String message;
    private T data;
    private ApiErrorPayload error;
    private String timestamp;
}
