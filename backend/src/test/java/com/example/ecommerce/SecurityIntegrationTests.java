package com.example.ecommerce;

import com.example.ecommerce.common.domain.AccountStatus;
import com.example.ecommerce.common.domain.UserRole;
import com.example.ecommerce.modal.Product;
import com.example.ecommerce.modal.Seller;
import com.example.ecommerce.modal.User;
import com.example.ecommerce.modal.VerificationCode;
import com.example.ecommerce.repository.ProductRepository;
import com.example.ecommerce.repository.SellerRepository;
import com.example.ecommerce.repository.UserRepository;
import com.example.ecommerce.repository.VerificationCodeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.CookieManager;
import java.net.CookiePolicy;
import java.net.HttpCookie;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@TestPropertySource(properties = {
        "app.rate-limit.max-requests-per-minute=5",
        "app.rate-limit.window-seconds=60"
})
class SecurityIntegrationTests {

    @LocalServerPort
    private int port;

    private final HttpClient httpClient = HttpClient.newHttpClient();

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SellerRepository sellerRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private VerificationCodeRepository verificationCodeRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @BeforeEach
    void clearAuthFixtures() {
        jdbcTemplate.update("delete from verification_code");
    }

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

        HttpResponse<String> first = null;
        HttpResponse<String> fifth = null;
        HttpResponse<String> sixth = null;

        for (int i = 1; i <= 6; i++) {
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (i == 1) first = response;
            if (i == 5) fifth = response;
            if (i == 6) sixth = response;
        }

        assertTrue(first != null && first.statusCode() != 429);
        assertTrue(fifth != null && fifth.statusCode() != 429);
        assertTrue(sixth != null && sixth.statusCode() == 429);
    }

    @Test
    void logoutClearsCookieWithHttpOnlyAndSameSiteAttributes() throws Exception {
        String url = "http://localhost:" + port + "/api/auth/logout";
        HttpRequest request = HttpRequest.newBuilder(URI.create(url))
                .POST(HttpRequest.BodyPublishers.noBody())
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        assertEquals(200, response.statusCode());
        var setCookieHeaders = response.headers().allValues("set-cookie");
        assertTrue(!setCookieHeaders.isEmpty());
        assertTrue(setCookieHeaders.stream().anyMatch(value -> value.contains("ECOM_AUTH=")));
        assertTrue(setCookieHeaders.stream().anyMatch(value -> value.contains("HttpOnly")));
        assertTrue(setCookieHeaders.stream().anyMatch(value -> value.contains("SameSite=Lax")));
        assertTrue(setCookieHeaders.stream().anyMatch(value -> value.contains("Max-Age=0")));
    }

    @Test
    void corsPreflightAllowsConfiguredOriginAndCredentials() throws Exception {
        String url = "http://localhost:" + port + "/api/auth/users/profile";
        HttpRequest request = HttpRequest.newBuilder(URI.create(url))
                .method("OPTIONS", HttpRequest.BodyPublishers.noBody())
                .header("Origin", "http://localhost:3000")
                .header("Access-Control-Request-Method", "GET")
                .header("Access-Control-Request-Headers", "X-CSRF-Token")
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        assertTrue(response.statusCode() == 200 || response.statusCode() == 204);
        assertEquals(
                "http://localhost:3000",
                response.headers().firstValue("access-control-allow-origin").orElse(null)
        );
        assertEquals(
                "true",
                response.headers().firstValue("access-control-allow-credentials").orElse(null)
        );
    }

    @Test
    void customerOtpLoginSetsCookieAndProfileFetchSucceeds() throws Exception {
        String email = "customer.qa+" + System.nanoTime() + "@example.com";

        User user = new User();
        user.setFullName("Customer QA");
        user.setEmail(email);
        user.setPassword("encoded-password");
        user.setRole(UserRole.ROLE_CUSTOMER);
        user.setAccountStatus(AccountStatus.ACTIVE);
        userRepository.save(user);

        VerificationCode verificationCode = new VerificationCode();
        verificationCode.setEmail(user.getEmail());
        verificationCode.setOtp("123456");
        verificationCode.setCreatedAt(LocalDateTime.now());
        verificationCode.setExpiresAt(LocalDateTime.now().plusMinutes(10));
        verificationCodeRepository.save(verificationCode);

        CookieManager cookieManager = new CookieManager();
        cookieManager.setCookiePolicy(CookiePolicy.ACCEPT_ALL);
        HttpClient cookieClient = HttpClient.newBuilder()
                .cookieHandler(cookieManager)
                .build();

        String signinUrl = "http://localhost:" + port + "/api/auth/signin";
        String signinPayload = "{\"email\":\"" + email + "\",\"otp\":\"123456\"}";
        HttpRequest signinRequest = HttpRequest.newBuilder(URI.create(signinUrl))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(signinPayload))
                .build();

        HttpResponse<String> signinResponse = cookieClient.send(signinRequest, HttpResponse.BodyHandlers.ofString());

        assertEquals(200, signinResponse.statusCode());
        assertTrue(
                signinResponse.headers().allValues("set-cookie").stream().anyMatch(value -> value.contains("ECOM_AUTH="))
        );

        String profileUrl = "http://localhost:" + port + "/api/auth/users/profile";
        HttpRequest profileRequest = HttpRequest.newBuilder(URI.create(profileUrl))
                .GET()
                .build();

        HttpResponse<String> profileResponse = cookieClient.send(profileRequest, HttpResponse.BodyHandlers.ofString());

        assertEquals(200, profileResponse.statusCode());
        assertTrue(profileResponse.body().contains("\"email\":\"" + email + "\""));
        assertTrue(profileResponse.body().contains("\"fullName\":\"Customer QA\""));
    }

    @Test
    void sellerOtpLoginSetsCookieAndSellerProfileFetchSucceeds() throws Exception {
        String sellerEmail = "seller.qa+" + System.nanoTime() + "@example.com";

        Seller seller = new Seller();
        seller.setSellerName("Seller QA");
        seller.setEmail(sellerEmail);
        seller.setPassword("encoded-password");
        seller.setRole(UserRole.ROLE_SELLER);
        seller.setAccountStatus(AccountStatus.ACTIVE);
        sellerRepository.save(seller);

        VerificationCode verificationCode = new VerificationCode();
        verificationCode.setEmail(sellerEmail);
        verificationCode.setOtp("654321");
        verificationCode.setCreatedAt(LocalDateTime.now());
        verificationCode.setExpiresAt(LocalDateTime.now().plusMinutes(10));
        verificationCodeRepository.save(verificationCode);

        CookieManager cookieManager = new CookieManager();
        cookieManager.setCookiePolicy(CookiePolicy.ACCEPT_ALL);
        HttpClient cookieClient = HttpClient.newBuilder()
                .cookieHandler(cookieManager)
                .build();

        String signinUrl = "http://localhost:" + port + "/api/auth/signin";
        String signinPayload = "{\"email\":\"seller_" + sellerEmail + "\",\"otp\":\"654321\"}";
        HttpRequest signinRequest = HttpRequest.newBuilder(URI.create(signinUrl))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(signinPayload))
                .build();

        HttpResponse<String> signinResponse = cookieClient.send(signinRequest, HttpResponse.BodyHandlers.ofString());

        assertEquals(200, signinResponse.statusCode());
        assertTrue(
                signinResponse.headers().allValues("set-cookie").stream().anyMatch(value -> value.contains("ECOM_AUTH="))
        );

        String sellerProfileUrl = "http://localhost:" + port + "/sellers/profile";
        HttpRequest sellerProfileRequest = HttpRequest.newBuilder(URI.create(sellerProfileUrl))
                .GET()
                .build();

        HttpResponse<String> sellerProfileResponse = cookieClient.send(sellerProfileRequest, HttpResponse.BodyHandlers.ofString());

        assertEquals(200, sellerProfileResponse.statusCode());
        assertTrue(sellerProfileResponse.body().contains("\"email\":\"" + sellerEmail + "\""));
        assertTrue(sellerProfileResponse.body().contains("\"sellerName\":\"Seller QA\""));
    }

    @Test
    void sellerProductListAndCreateWorkWithCookieSession() throws Exception {
        String sellerEmail = "seller.products+" + System.nanoTime() + "@example.com";

        Seller seller = new Seller();
        seller.setSellerName("Seller Product QA");
        seller.setEmail(sellerEmail);
        seller.setPassword("encoded-password");
        seller.setRole(UserRole.ROLE_SELLER);
        seller.setAccountStatus(AccountStatus.ACTIVE);
        sellerRepository.save(seller);

        VerificationCode verificationCode = new VerificationCode();
        verificationCode.setEmail(sellerEmail);
        verificationCode.setOtp("778899");
        verificationCode.setCreatedAt(LocalDateTime.now());
        verificationCode.setExpiresAt(LocalDateTime.now().plusMinutes(10));
        verificationCodeRepository.save(verificationCode);

        CookieManager cookieManager = new CookieManager();
        cookieManager.setCookiePolicy(CookiePolicy.ACCEPT_ALL);
        HttpClient cookieClient = HttpClient.newBuilder()
                .cookieHandler(cookieManager)
                .build();

        String signinUrl = "http://localhost:" + port + "/api/auth/signin";
        String signinPayload = "{\"email\":\"seller_" + sellerEmail + "\",\"otp\":\"778899\"}";
        HttpRequest signinRequest = HttpRequest.newBuilder(URI.create(signinUrl))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(signinPayload))
                .build();

        HttpResponse<String> signinResponse = cookieClient.send(signinRequest, HttpResponse.BodyHandlers.ofString());
        assertEquals(200, signinResponse.statusCode());

        String profileUrl = "http://localhost:" + port + "/sellers/profile";
        HttpRequest profileRequest = HttpRequest.newBuilder(URI.create(profileUrl))
                .GET()
                .build();
        HttpResponse<String> profileResponse = cookieClient.send(profileRequest, HttpResponse.BodyHandlers.ofString());
        assertEquals(200, profileResponse.statusCode());

        String csrfToken = cookieManager.getCookieStore()
                .get(URI.create("http://localhost:" + port))
                .stream()
                .filter(cookie -> "XSRF-TOKEN".equals(cookie.getName()))
                .map(HttpCookie::getValue)
                .findFirst()
                .orElse(null);
        assertTrue(csrfToken != null && !csrfToken.isBlank());

        String createUrl = "http://localhost:" + port + "/api/sellers/products";
        String createPayload = """
                {
                  "title":"Seller Cookie Product",
                  "description":"seller product create via cookie session",
                  "brand":"QA",
                  "mrpPrice":2500,
                  "sellingPrice":1999,
                  "quantity":6,
                  "color":"Black",
                  "images":["https://example.com/p1.jpg"],
                  "category":"electronics",
                  "category2":"audio",
                  "category3":"earbuds",
                  "size":"M"
                }
                """;
        HttpRequest createRequest = HttpRequest.newBuilder(URI.create(createUrl))
                .header("Content-Type", "application/json")
                .header("X-CSRF-Token", csrfToken)
                .POST(HttpRequest.BodyPublishers.ofString(createPayload))
                .build();
        HttpResponse<String> createResponse = cookieClient.send(createRequest, HttpResponse.BodyHandlers.ofString());

        assertEquals(201, createResponse.statusCode());
        assertTrue(createResponse.body().contains("\"title\":\"Seller Cookie Product\""));

        String listUrl = "http://localhost:" + port + "/api/sellers/products";
        HttpRequest listRequest = HttpRequest.newBuilder(URI.create(listUrl))
                .GET()
                .build();
        HttpResponse<String> listResponse = cookieClient.send(listRequest, HttpResponse.BodyHandlers.ofString());

        assertEquals(200, listResponse.statusCode());
        assertTrue(listResponse.body().contains("\"title\":\"Seller Cookie Product\""));
    }

    @Test
    void logoutClearsCookieAndProtectedApiReturns401AfterLogout() throws Exception {
        String email = "logout.qa+" + System.nanoTime() + "@example.com";

        User user = new User();
        user.setFullName("Logout QA");
        user.setEmail(email);
        user.setPassword("encoded-password");
        user.setRole(UserRole.ROLE_CUSTOMER);
        user.setAccountStatus(AccountStatus.ACTIVE);
        userRepository.save(user);

        VerificationCode verificationCode = new VerificationCode();
        verificationCode.setEmail(email);
        verificationCode.setOtp("112233");
        verificationCode.setCreatedAt(LocalDateTime.now());
        verificationCode.setExpiresAt(LocalDateTime.now().plusMinutes(10));
        verificationCodeRepository.save(verificationCode);

        CookieManager cookieManager = new CookieManager();
        cookieManager.setCookiePolicy(CookiePolicy.ACCEPT_ALL);
        HttpClient cookieClient = HttpClient.newBuilder()
                .cookieHandler(cookieManager)
                .build();

        String signinUrl = "http://localhost:" + port + "/api/auth/signin";
        String signinPayload = "{\"email\":\"" + email + "\",\"otp\":\"112233\"}";
        HttpRequest signinRequest = HttpRequest.newBuilder(URI.create(signinUrl))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(signinPayload))
                .build();

        HttpResponse<String> signinResponse = cookieClient.send(signinRequest, HttpResponse.BodyHandlers.ofString());
        assertEquals(200, signinResponse.statusCode());

        String logoutUrl = "http://localhost:" + port + "/api/auth/logout";
        HttpRequest logoutRequest = HttpRequest.newBuilder(URI.create(logoutUrl))
                .POST(HttpRequest.BodyPublishers.noBody())
                .build();

        HttpResponse<String> logoutResponse = cookieClient.send(logoutRequest, HttpResponse.BodyHandlers.ofString());
        assertEquals(200, logoutResponse.statusCode());
        assertTrue(
                logoutResponse.headers().allValues("set-cookie").stream()
                        .anyMatch(value -> value.contains("ECOM_AUTH=") && value.contains("Max-Age=0"))
        );

        String protectedUrl = "http://localhost:" + port + "/api/auth/users/profile";
        HttpRequest protectedRequest = HttpRequest.newBuilder(URI.create(protectedUrl))
                .GET()
                .build();

        HttpResponse<String> protectedResponse = cookieClient.send(protectedRequest, HttpResponse.BodyHandlers.ofString());

        assertEquals(401, protectedResponse.statusCode());
    }

    @Test
    void cartCrudWorksWithCookieSession() throws Exception {
        String email = "cart.qa+" + System.nanoTime() + "@example.com";

        User user = new User();
        user.setFullName("Cart QA");
        user.setEmail(email);
        user.setPassword("encoded-password");
        user.setRole(UserRole.ROLE_CUSTOMER);
        user.setAccountStatus(AccountStatus.ACTIVE);
        userRepository.save(user);

        VerificationCode verificationCode = new VerificationCode();
        verificationCode.setEmail(email);
        verificationCode.setOtp("445566");
        verificationCode.setCreatedAt(LocalDateTime.now());
        verificationCode.setExpiresAt(LocalDateTime.now().plusMinutes(10));
        verificationCodeRepository.save(verificationCode);

        Product product = new Product();
        product.setTitle("Cart QA Product");
        product.setBrand("QA");
        product.setDescription("Cart flow test product");
        product.setMrpPrice(1500);
        product.setSellingPrice(1200);
        product.setDiscountPercentage(20);
        product.setWarehouseStock(25);
        product.setSellerStock(0);
        product.setActive(true);
        product.setCreatedAt(LocalDateTime.now());
        productRepository.save(product);

        CookieManager cookieManager = new CookieManager();
        cookieManager.setCookiePolicy(CookiePolicy.ACCEPT_ALL);
        HttpClient cookieClient = HttpClient.newBuilder()
                .cookieHandler(cookieManager)
                .build();

        String signinUrl = "http://localhost:" + port + "/api/auth/signin";
        String signinPayload = "{\"email\":\"" + email + "\",\"otp\":\"445566\"}";
        HttpRequest signinRequest = HttpRequest.newBuilder(URI.create(signinUrl))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(signinPayload))
                .build();

        HttpResponse<String> signinResponse = cookieClient.send(signinRequest, HttpResponse.BodyHandlers.ofString());
        assertEquals(200, signinResponse.statusCode());

        String cartUrl = "http://localhost:" + port + "/api/cart";
        HttpRequest csrfPrimeRequest = HttpRequest.newBuilder(URI.create(cartUrl))
                .GET()
                .build();
        HttpResponse<String> csrfPrimeResponse = cookieClient.send(csrfPrimeRequest, HttpResponse.BodyHandlers.ofString());
        assertEquals(200, csrfPrimeResponse.statusCode());

        String csrfToken = cookieManager.getCookieStore()
                .get(URI.create("http://localhost:" + port))
                .stream()
                .filter(cookie -> "XSRF-TOKEN".equals(cookie.getName()))
                .map(HttpCookie::getValue)
                .findFirst()
                .orElse(null);
        assertTrue(csrfToken != null && !csrfToken.isBlank());

        String addUrl = "http://localhost:" + port + "/api/cart/add";
        String addPayload = "{\"productId\":" + product.getId() + ",\"size\":\"M\",\"quantity\":2}";
        HttpRequest addRequest = HttpRequest.newBuilder(URI.create(addUrl))
                .header("Content-Type", "application/json")
                .header("X-CSRF-Token", csrfToken)
                .PUT(HttpRequest.BodyPublishers.ofString(addPayload))
                .build();

        HttpResponse<String> addResponse = cookieClient.send(addRequest, HttpResponse.BodyHandlers.ofString());
        assertEquals(201, addResponse.statusCode());
        assertTrue(addResponse.body().contains("\"totalItems\":2"));

        csrfToken = cookieManager.getCookieStore()
                .get(URI.create("http://localhost:" + port))
                .stream()
                .filter(cookie -> "XSRF-TOKEN".equals(cookie.getName()))
                .map(HttpCookie::getValue)
                .findFirst()
                .orElse(csrfToken);

        Long cartItemId = jdbcTemplate.queryForObject(
                "select id from cart_item where user_id = ? fetch first 1 rows only",
                Long.class,
                user.getId()
        );
        assertTrue(cartItemId != null);

        String updateUrl = "http://localhost:" + port + "/api/cart/item/" + cartItemId;
        String updatePayload = "{\"quantity\":3,\"size\":\"M\"}";
        HttpRequest updateRequest = HttpRequest.newBuilder(URI.create(updateUrl))
                .header("Content-Type", "application/json")
                .header("X-CSRF-Token", csrfToken)
                .PUT(HttpRequest.BodyPublishers.ofString(updatePayload))
                .build();

        HttpResponse<String> updateResponse = cookieClient.send(updateRequest, HttpResponse.BodyHandlers.ofString());
        assertEquals(200, updateResponse.statusCode());
        assertTrue(updateResponse.body().contains("\"totalItems\":3"));

        csrfToken = cookieManager.getCookieStore()
                .get(URI.create("http://localhost:" + port))
                .stream()
                .filter(cookie -> "XSRF-TOKEN".equals(cookie.getName()))
                .map(HttpCookie::getValue)
                .findFirst()
                .orElse(csrfToken);

        String deleteUrl = "http://localhost:" + port + "/api/cart/item/" + cartItemId;
        HttpRequest deleteRequest = HttpRequest.newBuilder(URI.create(deleteUrl))
                .header("X-CSRF-Token", csrfToken)
                .DELETE()
                .build();

        HttpResponse<String> deleteResponse = cookieClient.send(deleteRequest, HttpResponse.BodyHandlers.ofString());
        assertEquals(200, deleteResponse.statusCode());

        HttpRequest cartRequest = HttpRequest.newBuilder(URI.create(cartUrl))
                .GET()
                .build();

        HttpResponse<String> cartResponse = cookieClient.send(cartRequest, HttpResponse.BodyHandlers.ofString());
        assertEquals(200, cartResponse.statusCode());
        assertTrue(cartResponse.body().contains("\"totalItems\":0"));
    }
}


