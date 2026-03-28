package com.example.ecommerce.modal;

import com.example.ecommerce.common.domain.UserRole;
import com.example.ecommerce.common.persistence.UserRoleConverter;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "login_session_entries")
public class LoginSessionEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 64)
    private String sessionId;

    @Column(nullable = false, length = 255)
    private String principalEmail;

    @Convert(converter = UserRoleConverter.class)
    @Column(nullable = false, length = 32)
    private UserRole principalRole;

    @Column(nullable = false, length = 128)
    private String deviceKey;

    @Column(nullable = false, length = 160)
    private String deviceLabel;

    @Column(length = 64)
    private String ipAddress;

    @Column(length = 512)
    private String userAgent;

    @Column(nullable = false)
    private LocalDateTime loginAt;

    @Column(nullable = false)
    private LocalDateTime tokenExpiresAt;

    @Column
    private LocalDateTime loggedOutAt;

    @PrePersist
    void onCreate() {
        if (loginAt == null) {
            loginAt = LocalDateTime.now();
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getSessionId() {
        return sessionId;
    }

    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }

    public String getPrincipalEmail() {
        return principalEmail;
    }

    public void setPrincipalEmail(String principalEmail) {
        this.principalEmail = principalEmail;
    }

    public UserRole getPrincipalRole() {
        return principalRole;
    }

    public void setPrincipalRole(UserRole principalRole) {
        this.principalRole = principalRole;
    }

    public String getDeviceKey() {
        return deviceKey;
    }

    public void setDeviceKey(String deviceKey) {
        this.deviceKey = deviceKey;
    }

    public String getDeviceLabel() {
        return deviceLabel;
    }

    public void setDeviceLabel(String deviceLabel) {
        this.deviceLabel = deviceLabel;
    }

    public String getIpAddress() {
        return ipAddress;
    }

    public void setIpAddress(String ipAddress) {
        this.ipAddress = ipAddress;
    }

    public String getUserAgent() {
        return userAgent;
    }

    public void setUserAgent(String userAgent) {
        this.userAgent = userAgent;
    }

    public LocalDateTime getLoginAt() {
        return loginAt;
    }

    public void setLoginAt(LocalDateTime loginAt) {
        this.loginAt = loginAt;
    }

    public LocalDateTime getTokenExpiresAt() {
        return tokenExpiresAt;
    }

    public void setTokenExpiresAt(LocalDateTime tokenExpiresAt) {
        this.tokenExpiresAt = tokenExpiresAt;
    }

    public LocalDateTime getLoggedOutAt() {
        return loggedOutAt;
    }

    public void setLoggedOutAt(LocalDateTime loggedOutAt) {
        this.loggedOutAt = loggedOutAt;
    }
}
