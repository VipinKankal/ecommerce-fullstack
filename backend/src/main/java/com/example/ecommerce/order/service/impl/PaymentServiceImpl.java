package com.example.ecommerce.order.service.impl;

import com.example.ecommerce.common.domain.OrderStatus;
import com.example.ecommerce.common.domain.PaymentMethod;
import com.example.ecommerce.common.domain.PaymentOrderStatus;
import com.example.ecommerce.common.domain.PaymentProvider;
import com.example.ecommerce.common.domain.PaymentStatus;
import com.example.ecommerce.common.domain.PaymentType;
import com.example.ecommerce.common.domain.CouponReservationState;
import com.example.ecommerce.modal.Order;
import com.example.ecommerce.modal.PaymentOrder;
import com.example.ecommerce.modal.User;
import com.example.ecommerce.order.response.PhonePePaymentSession;
import com.example.ecommerce.order.service.CouponService;
import com.example.ecommerce.order.service.PaymentService;
import com.example.ecommerce.repository.OrderRepository;
import com.example.ecommerce.repository.PaymentOrderRepository;
import com.razorpay.Payment;
import com.razorpay.PaymentLink;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.checkout.Session;
import com.stripe.param.checkout.SessionCreateParams;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.json.JSONArray;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;
import java.util.Locale;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {
    private static final Logger log = LoggerFactory.getLogger(PaymentServiceImpl.class);
    private static final String PHONEPE_PAY_PATH = "/pg/v1/pay";
    private static final String PHONEPE_STATUS_PATH_TEMPLATE = "/pg/v1/status/%s/%s";

    private final PaymentOrderRepository paymentOrderRepository;
    private final OrderRepository orderRepository;
    private final CouponService couponService;
    private final HttpClient httpClient = HttpClient.newHttpClient();

    @Value("${payment.razorpay.api-key}")
    private String apiKey;

    @Value("${payment.razorpay.api-secret}")
    private String apiSecret;

    @Value("${payment.stripe.secret-key}")
    private String stripeSecretKey;

    @Value("${payment.phonepe.base-url:}")
    private String phonePeBaseUrl;

    @Value("${payment.phonepe.merchant-id:}")
    private String phonePeMerchantId;

    @Value("${payment.phonepe.salt-key:}")
    private String phonePeSaltKey;

    @Value("${payment.phonepe.salt-index:}")
    private String phonePeSaltIndex;

    @Value("${app.frontend.base-url:http://localhost:3000}")
    private String frontendBaseUrl;

    @Value("${app.backend.base-url:http://localhost:8080}")
    private String backendBaseUrl;

    @PostConstruct
    void logPaymentConfigStatus() {
        log.info(
                "Payment config loaded: phonePeConfigured={}, razorpayConfigured={}, razorpayKeyPrefix={}, razorpaySecretSuffix={}, stripeConfigured={}",
                isPhonePeConfigured(),
                isRazorpayConfigured(),
                maskPrefix(apiKey),
                maskSuffix(apiSecret),
                isStripeConfigured()
        );
    }

    @Override
    public PaymentOrder createOrder(
            User user,
            Set<Order> orders,
            PaymentMethod paymentMethod,
            PaymentType paymentType,
            PaymentProvider provider
    ) {
        Long amount = orders.stream().mapToLong(Order::getTotalSellingPrice).sum();
        PaymentOrder paymentOrder = new PaymentOrder();
        paymentOrder.setAmount(amount);
        paymentOrder.setUser(user);
        paymentOrder.setOrders(orders);
        paymentOrder.setPaymentMethod(paymentMethod);
        paymentOrder.setPaymentType(paymentType);
        paymentOrder.setProvider(provider);
        return paymentOrderRepository.save(paymentOrder);
    }

    @Override
    public PaymentOrder getPaymentOrderById(Long orderId) throws Exception {
        return paymentOrderRepository.findById(orderId).orElseThrow(
                () -> new Exception("Payment Order not found"));
    }

    @Override
    public PaymentOrder getPaymentOrderByPaymentId(String orderId) throws Exception {
        PaymentOrder paymentOrder = paymentOrderRepository.findByPaymentLinkId(orderId);
        if (paymentOrder == null) {
            throw new Exception("Payment Order not found with provided payment link id: " + orderId);
        }
        return paymentOrder;
    }

    @Override
    public PaymentOrder getPaymentOrderByMerchantTransactionId(String merchantTransactionId) throws Exception {
        PaymentOrder paymentOrder = paymentOrderRepository.findByMerchantTransactionId(merchantTransactionId);
        if (paymentOrder == null) {
            throw new Exception("Payment Order not found with provided merchant transaction id: " + merchantTransactionId);
        }
        return paymentOrder;
    }

    @Override
    public Boolean ProceedPaymentOrder(PaymentOrder paymentOrder, String paymentId, String paymentLinkId) throws RazorpayException {
        if (paymentOrder.getStatus().equals(PaymentOrderStatus.PENDING)) {
            if (paymentOrder.getPaymentLinkId() == null || !paymentOrder.getPaymentLinkId().equals(paymentLinkId)) {
                throw new RazorpayException("Invalid payment link reference");
            }

            RazorpayClient razorpay = new RazorpayClient(apiKey, apiSecret);
            Payment payment = razorpay.payments.fetch(paymentId);
            String status = payment.get("status");

            if ("captured".equals(status)) {
                Set<Order> orders = paymentOrder.getOrders();
                for (Order order : orders) {
                    order.setPaymentStatus(PaymentStatus.SUCCESS);
                    if (order.getOrderStatus() == OrderStatus.INITIATED || order.getOrderStatus() == OrderStatus.PENDING) {
                        order.setOrderStatus(OrderStatus.PLACED);
                    }
                    orderRepository.save(order);
                }
                paymentOrder.setStatus(PaymentOrderStatus.SUCCESS);
                paymentOrderRepository.save(paymentOrder);
                return true;
            }

            paymentOrder.setStatus(PaymentOrderStatus.FAILED);
            releaseReservationOnFailure(paymentOrder);
            paymentOrderRepository.save(paymentOrder);
            return false;
        }

        return false;
    }

    @Override
    public void assertPhonePeConfigured() {
        if (!isPhonePeConfigured()) {
            throw new IllegalArgumentException(
                    "PhonePe is not configured. Set PHONEPE_BASE_URL, PHONEPE_MERCHANT_ID, PHONEPE_SALT_KEY and PHONEPE_SALT_INDEX."
            );
        }
    }

    @Override
    public PhonePePaymentSession createPhonePePaymentSession(User user, PaymentOrder paymentOrder) throws Exception {
        assertPhonePeConfigured();

        String merchantTransactionId = buildMerchantTransactionId(paymentOrder.getId());
        JSONObject payload = new JSONObject();
        payload.put("merchantId", phonePeMerchantId);
        payload.put("merchantTransactionId", merchantTransactionId);
        payload.put("merchantUserId", "USER-" + user.getId());
        payload.put("amount", paymentOrder.getAmount() * 100);
        payload.put("redirectUrl", buildFrontendUrl(
                "/payment-success/" + paymentOrder.getId()
                        + "?provider=PHONEPE&merchantTransactionId=" + merchantTransactionId
        ));
        payload.put("redirectMode", "REDIRECT");
        payload.put("callbackUrl", buildBackendUrl(
                "/api/payment/phonepe/webhook?merchantTransactionId=" + merchantTransactionId
        ));

        JSONObject paymentInstrument = new JSONObject();
        paymentInstrument.put("type", "PAY_PAGE");
        payload.put("paymentInstrument", paymentInstrument);

        if (isMeaningfulSecret(user.getMobileNumber())) {
            payload.put("mobileNumber", user.getMobileNumber().trim());
        }

        String encodedRequest = Base64.getEncoder()
                .encodeToString(payload.toString().getBytes(StandardCharsets.UTF_8));

        JSONObject requestBody = new JSONObject();
        requestBody.put("request", encodedRequest);

        JSONObject response = sendPhonePePost(PHONEPE_PAY_PATH, requestBody, encodedRequest);
        String redirectUrl = firstNonBlank(
                extractNestedString(response, "data", "instrumentResponse", "redirectInfo", "url"),
                extractNestedString(response, "data", "redirectInfo", "url"),
                extractNestedString(response, "data", "instrumentResponse", "intentUrl"),
                extractNestedString(response, "data", "intentUrl")
        );

        if (!isMeaningfulSecret(redirectUrl)) {
            throw new IllegalArgumentException(firstNonBlank(
                    extractNestedString(response, "message"),
                    "PhonePe did not return a redirect URL."
            ));
        }

        paymentOrder.setProvider(PaymentProvider.PHONEPE);
        paymentOrder.setPaymentMethod(PaymentMethod.UPI);
        paymentOrder.setPaymentType(PaymentType.UPI);
        paymentOrder.setMerchantTransactionId(merchantTransactionId);
        paymentOrder.setPaymentLinkId(merchantTransactionId);
        paymentOrderRepository.save(paymentOrder);

        return new PhonePePaymentSession(merchantTransactionId, redirectUrl);
    }

    @Override
    public PaymentOrder syncPhonePePaymentStatus(PaymentOrder paymentOrder) throws Exception {
        if (paymentOrder.getProvider() != PaymentProvider.PHONEPE) {
            return paymentOrder;
        }

        if (!isMeaningfulSecret(paymentOrder.getMerchantTransactionId())) {
            throw new IllegalArgumentException("PhonePe merchant transaction id is missing");
        }

        JSONObject response = fetchPhonePeStatus(paymentOrder.getMerchantTransactionId());
        String status = resolvePhonePeStatus(response);

        if ("SUCCESS".equals(status)) {
            paymentOrder.setStatus(PaymentOrderStatus.SUCCESS);
            for (Order order : paymentOrder.getOrders()) {
                order.setPaymentStatus(PaymentStatus.SUCCESS);
                if (order.getOrderStatus() == OrderStatus.INITIATED || order.getOrderStatus() == OrderStatus.PENDING) {
                    order.setOrderStatus(OrderStatus.PLACED);
                }
                orderRepository.save(order);
            }
        } else if ("FAILED".equals(status)) {
            paymentOrder.setStatus(PaymentOrderStatus.FAILED);
            releaseReservationOnFailure(paymentOrder);
            for (Order order : paymentOrder.getOrders()) {
                order.setPaymentStatus(PaymentStatus.FAILED);
                orderRepository.save(order);
            }
        }

        return paymentOrderRepository.save(paymentOrder);
    }

    @Override
    public PaymentLink createRazorpayPaymentLink(User user, Long amount, Long orderId) throws RazorpayException {
        if (!isRazorpayConfigured()) {
            throw new IllegalArgumentException("Razorpay is not configured. Set RAZORPAY_API_KEY and RAZORPAY_API_SECRET.");
        }
        amount = amount * 100;
        try {
            RazorpayClient razorpay = new RazorpayClient(apiKey, apiSecret);

            JSONObject paymentLinkRequest = new JSONObject();
            paymentLinkRequest.put("amount", amount);
            paymentLinkRequest.put("currency", "INR");

            JSONObject customer = new JSONObject();
            customer.put("name", user.getFullName());
            customer.put("email", user.getEmail());
            paymentLinkRequest.put("customer", customer);

            JSONObject notify = new JSONObject();
            notify.put("email", true);
            paymentLinkRequest.put("notify", notify);

            paymentLinkRequest.put("callback_url", buildFrontendUrl("/payment-success/" + orderId));
            paymentLinkRequest.put("callback_method", "get");

            return razorpay.paymentLink.create(paymentLinkRequest);

        } catch (Exception e) {
            throw new RazorpayException(e.getMessage());
        }
    }

    @Override
    public String createStripePaymentLink(User user, Long amount, Long orderId) throws StripeException {
        if (!isStripeConfigured()) {
            throw new IllegalArgumentException("Stripe is not configured. Set STRIPE_SECRET_KEY.");
        }
        Stripe.apiKey = stripeSecretKey;
        SessionCreateParams params = SessionCreateParams.builder()
                .addPaymentMethodType(SessionCreateParams.PaymentMethodType.CARD)
                .setMode(SessionCreateParams.Mode.PAYMENT)
                .setSuccessUrl(buildFrontendUrl("/payment-success/" + orderId))
                .setCancelUrl(buildFrontendUrl("/payment-cancel"))
                .addLineItem(SessionCreateParams.LineItem.builder()
                        .setQuantity(1L)
                        .setPriceData(SessionCreateParams.LineItem.PriceData.builder()
                                .setCurrency("inr")
                                .setUnitAmount(amount * 100)
                                .setProductData(
                                        SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                                .setName("Vipin e comm paymet" + orderId)
                                                .build()
                                )
                                .build()
                        )
                        .build()
                ).build();

        Session session = Session.create(params);
        return session.getUrl();
    }

    private String buildFrontendUrl(String path) {
        String baseUrl = frontendBaseUrl == null ? "http://localhost:3000" : frontendBaseUrl.trim();
        if (baseUrl.endsWith("/")) {
            baseUrl = baseUrl.substring(0, baseUrl.length() - 1);
        }
        if (!path.startsWith("/")) {
            path = "/" + path;
        }
        return baseUrl + path;
    }

    private boolean isRazorpayConfigured() {
        return isMeaningfulSecret(apiKey) && isMeaningfulSecret(apiSecret)
                && !"api_key".equalsIgnoreCase(apiKey)
                && !"api_secret".equalsIgnoreCase(apiSecret);
    }

    private boolean isPhonePeConfigured() {
        return isMeaningfulSecret(phonePeBaseUrl)
                && isMeaningfulSecret(phonePeMerchantId)
                && isMeaningfulSecret(phonePeSaltKey)
                && isMeaningfulSecret(phonePeSaltIndex);
    }

    private boolean isStripeConfigured() {
        return isMeaningfulSecret(stripeSecretKey)
                && !"stripe_secret_key".equalsIgnoreCase(stripeSecretKey);
    }

    private boolean isMeaningfulSecret(String value) {
        return value != null && !value.trim().isEmpty();
    }

    private String maskPrefix(String value) {
        if (!isMeaningfulSecret(value)) return "MISSING";
        String trimmed = value.trim();
        return trimmed.length() <= 8 ? trimmed : trimmed.substring(0, 8) + "...";
    }

    private String maskSuffix(String value) {
        if (!isMeaningfulSecret(value)) return "MISSING";
        String trimmed = value.trim();
        return trimmed.length() <= 4 ? "****" : "****" + trimmed.substring(trimmed.length() - 4);
    }

    private JSONObject sendPhonePePost(String path, JSONObject requestBody, String encodedRequest) throws Exception {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(normalizeUrl(phonePeBaseUrl) + path))
                .header("Content-Type", "application/json")
                .header("accept", "application/json")
                .header("X-VERIFY", buildPhonePePayloadSignature(encodedRequest, path))
                .POST(HttpRequest.BodyPublishers.ofString(requestBody.toString()))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        return parsePhonePeResponse(response.body());
    }

    private JSONObject fetchPhonePeStatus(String merchantTransactionId) throws Exception {
        String path = PHONEPE_STATUS_PATH_TEMPLATE.formatted(phonePeMerchantId, merchantTransactionId);
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(normalizeUrl(phonePeBaseUrl) + path))
                .header("accept", "application/json")
                .header("Content-Type", "application/json")
                .header("X-VERIFY", buildPhonePeStatusSignature(path))
                .header("X-MERCHANT-ID", phonePeMerchantId)
                .GET()
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        return parsePhonePeResponse(response.body());
    }

    private JSONObject parsePhonePeResponse(String body) {
        if (!isMeaningfulSecret(body)) {
            throw new IllegalArgumentException("Empty response received from PhonePe");
        }
        return new JSONObject(body);
    }

    private String resolvePhonePeStatus(JSONObject response) {
        String combined = firstNonBlank(
                extractNestedString(response, "data", "state"),
                extractNestedString(response, "state"),
                extractNestedString(response, "data", "status"),
                extractNestedString(response, "status"),
                extractNestedString(response, "code"),
                extractNestedString(response, "message")
        );

        String normalized = combined == null ? "" : combined.trim().toUpperCase(Locale.ROOT);
        if (normalized.contains("SUCCESS")
                || normalized.contains("COMPLETED")
                || normalized.contains("CAPTURED")
                || normalized.contains("PAYMENT_SUCCESS")) {
            return "SUCCESS";
        }
        if (normalized.contains("FAIL")
                || normalized.contains("DECLINED")
                || normalized.contains("ERROR")
                || normalized.contains("EXPIRED")
                || normalized.contains("CANCELLED")) {
            return "FAILED";
        }
        return "PENDING";
    }

    private String buildMerchantTransactionId(Long paymentOrderId) {
        return "PHONEPE-" + paymentOrderId + "-" + System.currentTimeMillis();
    }

    private String buildPhonePePayloadSignature(String encodedRequest, String path) throws Exception {
        return sha256Hex(encodedRequest + path + phonePeSaltKey) + "###" + phonePeSaltIndex;
    }

    private String buildPhonePeStatusSignature(String path) throws Exception {
        return sha256Hex(path + phonePeSaltKey) + "###" + phonePeSaltIndex;
    }

    private String sha256Hex(String value) throws Exception {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        byte[] hash = digest.digest(value.getBytes(StandardCharsets.UTF_8));
        StringBuilder builder = new StringBuilder();
        for (byte b : hash) {
            builder.append(String.format("%02x", b));
        }
        return builder.toString();
    }

    private String buildBackendUrl(String path) {
        String baseUrl = backendBaseUrl == null ? "http://localhost:8080" : backendBaseUrl.trim();
        if (baseUrl.endsWith("/")) {
            baseUrl = baseUrl.substring(0, baseUrl.length() - 1);
        }
        if (!path.startsWith("/")) {
            path = "/" + path;
        }
        return baseUrl + path;
    }

    private String normalizeUrl(String url) {
        if (url == null) {
            return "";
        }
        return url.endsWith("/") ? url.substring(0, url.length() - 1) : url;
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (isMeaningfulSecret(value)) {
                return value;
            }
        }
        return null;
    }

    private String extractNestedString(JSONObject root, String... path) {
        Object current = root;
        for (String key : path) {
            if (!(current instanceof JSONObject currentObject) || !currentObject.has(key)) {
                return null;
            }
            current = currentObject.opt(key);
        }
        return extractStringValue(current);
    }

    private String extractStringValue(Object value) {
        if (value == null || value == JSONObject.NULL) {
            return null;
        }
        if (value instanceof String str) {
            return str;
        }
        if (value instanceof Number || value instanceof Boolean) {
            return String.valueOf(value);
        }
        if (value instanceof JSONObject object) {
            return firstNonBlank(
                    extractNestedString(object, "url"),
                    extractNestedString(object, "redirectUrl"),
                    extractNestedString(object, "merchantTransactionId"),
                    extractNestedString(object, "transactionId"),
                    extractNestedString(object, "status"),
                    extractNestedString(object, "state")
            );
        }
        if (value instanceof JSONArray array) {
            for (int index = 0; index < array.length(); index++) {
                String nested = extractStringValue(array.opt(index));
                if (nested != null) {
                    return nested;
                }
            }
        }
        return null;
    }

    private void releaseReservationOnFailure(PaymentOrder paymentOrder) {
        if (paymentOrder == null) {
            return;
        }
        if (paymentOrder.getCouponReservationState() != CouponReservationState.RESERVED) {
            return;
        }
        Order primaryOrder = paymentOrder.getOrders() == null
                ? null
                : paymentOrder.getOrders().stream()
                .min(java.util.Comparator.comparing(Order::getId, java.util.Comparator.nullsLast(Long::compareTo)))
                .orElse(null);
        String couponCode = primaryOrder == null ? null : primaryOrder.getCouponCode();
        couponService.releaseCouponReservation(
                couponCode,
                paymentOrder.getUser() == null ? null : paymentOrder.getUser().getId(),
                "PAYMENT_FAILED",
                "Coupon reservation released after payment failure"
        );
        paymentOrder.setCouponReservationState(CouponReservationState.RELEASED);
    }
}






