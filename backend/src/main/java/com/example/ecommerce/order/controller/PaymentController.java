package com.example.ecommerce.order.controller;

import com.example.ecommerce.common.domain.PaymentOrderStatus;
import com.example.ecommerce.common.domain.PaymentProvider;
import com.example.ecommerce.common.domain.CouponReservationState;
import com.example.ecommerce.modal.*;
import com.example.ecommerce.common.response.ApiResponse;
import com.example.ecommerce.order.response.CheckoutPaymentStatusResponse;
import com.example.ecommerce.order.service.CouponService;
import com.example.ecommerce.order.service.PaymentService;
import com.example.ecommerce.order.service.SettlementLedgerService;
import com.example.ecommerce.order.service.TransactionService;
import com.example.ecommerce.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.json.JSONObject;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Comparator;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/payment")
public class PaymentController {

    private final PaymentService paymentService;
    private final UserService userService;
    private final CouponService couponService;
    private final TransactionService transactionService;
    private final SettlementLedgerService settlementLedgerService;

    @GetMapping("/{paymentId}")
    @PreAuthorize("hasAnyRole('CUSTOMER','ADMIN')")
    @Transactional
    public ResponseEntity<CheckoutPaymentStatusResponse> getPaymentSuccessHandler(
            @PathVariable String paymentId,
            @RequestParam String paymentLinkId,
            @RequestHeader(value = "Authorization", required = false) String jwt
    ) throws Exception {
        User user = userService.findUserByJwtToken(jwt);
        PaymentOrder paymentOrder = paymentService.getPaymentOrderByPaymentId(paymentLinkId);
        if (paymentOrder.getUser() == null || !paymentOrder.getUser().getId().equals(user.getId())) {
            throw new Exception("Unauthorized payment callback");
        }

        PaymentOrderStatus previousStatus = paymentOrder.getStatus();
        boolean isPaymentSuccessful = paymentService.ProceedPaymentOrder(paymentOrder, paymentId, paymentLinkId);
        if (isPaymentSuccessful && previousStatus == PaymentOrderStatus.PENDING) {
            applySuccessfulPaymentSideEffects(paymentOrder);
        }

        return new ResponseEntity<>(
                buildCheckoutPaymentStatusResponse(
                        paymentOrder,
                        isPaymentSuccessful ? "Payment successful" : "Payment verification failed"
                ),
                HttpStatus.ACCEPTED
        );
    }

    @GetMapping("/orders/{paymentOrderId}/status")
    @PreAuthorize("hasAnyRole('CUSTOMER','ADMIN')")
    @Transactional
    public ResponseEntity<CheckoutPaymentStatusResponse> getCheckoutPaymentStatus(
            @PathVariable Long paymentOrderId,
            @RequestHeader(value = "Authorization", required = false) String jwt
    ) throws Exception {
        User user = userService.findUserByJwtToken(jwt);
        PaymentOrder paymentOrder = paymentService.getPaymentOrderById(paymentOrderId);
        if (paymentOrder.getUser() == null || !paymentOrder.getUser().getId().equals(user.getId())) {
            throw new Exception("Unauthorized payment status access");
        }

        PaymentOrderStatus previousStatus = paymentOrder.getStatus();
        if (paymentOrder.getProvider() == PaymentProvider.PHONEPE) {
            paymentOrder = paymentService.syncPhonePePaymentStatus(paymentOrder);
        }
        if (previousStatus == PaymentOrderStatus.PENDING && paymentOrder.getStatus() == PaymentOrderStatus.SUCCESS) {
            applySuccessfulPaymentSideEffects(paymentOrder);
        }

        String message = switch (paymentOrder.getStatus()) {
            case SUCCESS -> "Payment successful";
            case FAILED -> "Payment failed";
            default -> "Payment is still pending";
        };

        return ResponseEntity.ok(buildCheckoutPaymentStatusResponse(paymentOrder, message));
    }

    @PostMapping("/phonepe/webhook")
    @Transactional
    public ResponseEntity<ApiResponse> handlePhonePeWebhook(
            @RequestParam(required = false) String merchantTransactionId,
            @RequestBody(required = false) String rawBody
    ) throws Exception {
        String resolvedMerchantTransactionId = resolveMerchantTransactionId(merchantTransactionId, rawBody);
        if (resolvedMerchantTransactionId == null || resolvedMerchantTransactionId.isBlank()) {
            ApiResponse response = new ApiResponse();
            response.setMessage("PhonePe webhook ignored: merchant transaction id missing");
            return ResponseEntity.ok(response);
        }

        PaymentOrder paymentOrder = paymentService.getPaymentOrderByMerchantTransactionId(resolvedMerchantTransactionId);
        PaymentOrderStatus previousStatus = paymentOrder.getStatus();
        paymentOrder = paymentService.syncPhonePePaymentStatus(paymentOrder);
        if (previousStatus == PaymentOrderStatus.PENDING && paymentOrder.getStatus() == PaymentOrderStatus.SUCCESS) {
            applySuccessfulPaymentSideEffects(paymentOrder);
        }

        ApiResponse response = new ApiResponse();
        response.setMessage("PhonePe webhook processed");
        return ResponseEntity.ok(response);
    }

    private void applySuccessfulPaymentSideEffects(PaymentOrder paymentOrder) throws Exception {
        Order primaryOrder = resolvePrimaryOrder(paymentOrder.getOrders());
        if (primaryOrder != null && primaryOrder.getUser() != null) {
            couponService.markCouponUsedIfPresent(primaryOrder.getUser(), paymentOrder.getOrders());
        }
        if (paymentOrder.getCouponReservationState() == CouponReservationState.RESERVED) {
            paymentOrder.setCouponReservationState(CouponReservationState.CONSUMED);
        }
        for (Order order : paymentOrder.getOrders()) {
            transactionService.createTransaction(order);
        }
        settlementLedgerService.recordSuccessfulPayment(paymentOrder);
    }

    private CheckoutPaymentStatusResponse buildCheckoutPaymentStatusResponse(
            PaymentOrder paymentOrder,
            String message
    ) {
        Order primaryOrder = resolvePrimaryOrder(paymentOrder.getOrders());
        CheckoutPaymentStatusResponse response = new CheckoutPaymentStatusResponse();
        response.setPaymentOrderId(paymentOrder.getId());
        response.setOrderId(primaryOrder != null ? primaryOrder.getId() : null);
        response.setPaymentMethod(primaryOrder != null ? primaryOrder.getPaymentMethod() : paymentOrder.getPaymentMethod());
        response.setPaymentType(primaryOrder != null ? primaryOrder.getPaymentType() : paymentOrder.getPaymentType());
        response.setProvider(primaryOrder != null ? primaryOrder.getProvider() : paymentOrder.getProvider());
        response.setPaymentStatus(
                primaryOrder != null ? primaryOrder.getPaymentStatus() : mapPaymentOrderStatus(paymentOrder.getStatus())
        );
        response.setOrderStatus(primaryOrder != null ? primaryOrder.getOrderStatus() : null);
        response.setMessage(message);
        return response;
    }

    private Order resolvePrimaryOrder(List<Order> orders) {
        return orders == null
                ? null
                : orders.stream()
                .min(Comparator.comparing(Order::getId, Comparator.nullsLast(Long::compareTo)))
                .orElse(null);
    }

    private Order resolvePrimaryOrder(java.util.Set<Order> orders) {
        return orders == null
                ? null
                : orders.stream()
                .min(Comparator.comparing(Order::getId, Comparator.nullsLast(Long::compareTo)))
                .orElse(null);
    }

    private com.example.ecommerce.common.domain.PaymentStatus mapPaymentOrderStatus(PaymentOrderStatus status) {
        return switch (status) {
            case SUCCESS -> com.example.ecommerce.common.domain.PaymentStatus.SUCCESS;
            case FAILED -> com.example.ecommerce.common.domain.PaymentStatus.FAILED;
            default -> com.example.ecommerce.common.domain.PaymentStatus.PENDING;
        };
    }

    private String resolveMerchantTransactionId(String requestValue, String rawBody) {
        if (requestValue != null && !requestValue.isBlank()) {
            return requestValue.trim();
        }
        if (rawBody == null || rawBody.isBlank()) {
            return null;
        }

        try {
            JSONObject payload = new JSONObject(rawBody);
            String direct = firstNonBlank(
                    extractNestedString(payload, "merchantTransactionId"),
                    extractNestedString(payload, "data", "merchantTransactionId"),
                    extractNestedString(payload, "payload", "merchantTransactionId")
            );
            if (direct != null) {
                return direct;
            }

            String encodedResponse = payload.optString("response", null);
            if (encodedResponse != null && !encodedResponse.isBlank()) {
                String decoded = new String(Base64.getDecoder().decode(encodedResponse), StandardCharsets.UTF_8);
                JSONObject decodedPayload = new JSONObject(decoded);
                return firstNonBlank(
                        extractNestedString(decodedPayload, "merchantTransactionId"),
                        extractNestedString(decodedPayload, "data", "merchantTransactionId"),
                        extractNestedString(decodedPayload, "payload", "merchantTransactionId")
                );
            }
        } catch (Exception ignored) {
            return null;
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
        if (current == null || current == JSONObject.NULL) {
            return null;
        }
        return String.valueOf(current);
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return null;
    }
}

