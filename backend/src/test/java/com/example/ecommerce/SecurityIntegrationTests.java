package com.example.ecommerce;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@TestPropertySource(properties = {
        "app.rate-limit.max-requests-per-minute=2",
        "app.rate-limit.window-seconds=60"
})
class SecurityIntegrationTests {

    @LocalServerPort
    private int port;

    private final HttpClient httpClient = HttpClient.newHttpClient();

    @Test
    void publicSignupEndpointReachableWithoutJwt() throws Exception {
        String url = "http://localhost:" + port + "/api/auth/signup";
        HttpRequest request = HttpRequest.newBuilder(URI.create(url))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString("{}"))
                .build();
        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        assertTrue(response.statusCode() >= 400 && response.statusCode() < 500);
    }

    @Test
    void adminSignupEndpointIsNotPubliclyAvailable() throws Exception {
        String url = "http://localhost:" + port + "/api/admin/auth/signup";
        String payload = "{\"fullName\":\"Admin User\",\"email\":\"admin@example.com\",\"mobileNumber\":\"9876543210\",\"password\":\"password123\"}";
        HttpRequest request = HttpRequest.newBuilder(URI.create(url))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(payload))
                .build();
        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        assertTrue(response.statusCode() == 401 || response.statusCode() == 403 || response.statusCode() == 404);
    }

    @Test
    void protectedEndpointRejectsAnonymousAccess() throws Exception {
        String url = "http://localhost:" + port + "/api/orders/user/history";
        HttpRequest request = HttpRequest.newBuilder(URI.create(url))
                .GET()
                .build();
        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        assertTrue(response.statusCode() >= 400 && response.statusCode() < 500);
    }

    @Test
    void otpEndpointIsRateLimitedByIp() throws Exception {
        String url = "http://localhost:" + port + "/api/auth/sent/login-signup-otp";
        String payload = "{\"email\":\"user@example.com\",\"role\":\"ROLE_CUSTOMER\"}";
        HttpRequest request = HttpRequest.newBuilder(URI.create(url))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(payload))
                .build();

        HttpResponse<String> first = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        HttpResponse<String> second = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        HttpResponse<String> third = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        assertTrue(first.statusCode() != 429);
        assertTrue(second.statusCode() != 429);
        assertTrue(third.statusCode() == 429);
    }
}


