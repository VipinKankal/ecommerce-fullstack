package com.example.ecommerce.common.response;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class LoginHistoryEntryResponse {
    private String device;
    private String ipAddress;
    private LocalDateTime loginAt;
    private LocalDateTime logoutAt;
    private boolean active;
}
