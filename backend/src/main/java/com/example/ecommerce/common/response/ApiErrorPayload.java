package com.example.ecommerce.common.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ApiErrorPayload {
    private ApiErrorCode code;
    private Object details;
}
