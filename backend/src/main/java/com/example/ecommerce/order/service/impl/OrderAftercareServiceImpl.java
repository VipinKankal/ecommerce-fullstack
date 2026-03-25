package com.example.ecommerce.order.service.impl;

import com.example.ecommerce.inventory.service.InventoryService;
import com.example.ecommerce.modal.Order;
import com.example.ecommerce.modal.OrderItem;
import com.example.ecommerce.modal.OrderReturnExchangeRequest;
import com.example.ecommerce.modal.Product;
import com.example.ecommerce.modal.RequestHistoryEntry;
import com.example.ecommerce.modal.User;
import com.example.ecommerce.order.service.OrderAftercareService;
import com.example.ecommerce.order.service.CouponService;
import com.example.ecommerce.repository.OrderItemRepository;
import com.example.ecommerce.repository.OrderRepository;
import com.example.ecommerce.repository.OrderReturnExchangeRequestRepository;
import com.example.ecommerce.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional
public class OrderAftercareServiceImpl implements OrderAftercareService {

    private static final Set<String> FINAL_RETURN_STATUSES = Set.of("RETURN_REJECTED", "RETURNED");
    private static final Set<String> FINAL_EXCHANGE_STATUSES = Set.of("EXCHANGE_REJECTED", "EXCHANGE_COMPLETED");

    private final OrderItemRepository orderItemRepository;
    private final OrderReturnExchangeRequestRepository requestRepository;
    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final InventoryService inventoryService;
    private final CouponService couponService;
    private final OrderAftercareTaxAdjustmentService orderAftercareTaxAdjustmentService;

    @Override
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getCustomerReturnRequests(Long customerId) {
        return requestRepository.findByCustomerIdAndRequestTypeOrderByRequestedAtDesc(customerId, "RETURN").stream()
                .map(this::toReturnResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getCustomerExchangeRequests(Long customerId) {
        return requestRepository.findByCustomerIdAndRequestTypeOrderByRequestedAtDesc(customerId, "EXCHANGE").stream()
                .map(this::toExchangeResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getCustomerReturnExchangeRequests(Long customerId) {
        return requestRepository.findByCustomerIdOrderByRequestedAtDesc(customerId).stream()
                .map(this::toCombinedResponse)
                .toList();
    }

    @Override
    public Map<String, Object> createReturnRequest(User customer, Long orderItemId, Map<String, Object> payload) throws Exception {
        OrderItem orderItem = requireCustomerOrderItem(customer, orderItemId);
        ensureNoActiveRequest(orderItemId, "RETURN");

        OrderReturnExchangeRequest request = buildBaseRequest(customer, orderItem, "RETURN");
        request.setStatus("RETURN_REQUESTED");
        request.setReasonCode(firstNonBlank(valueAsString(payload, "reasonCode"), valueAsString(payload, "returnReason")));
        request.setCustomerComment(firstNonBlank(valueAsString(payload, "customerComment"), valueAsString(payload, "comment")));
        request.setRefundStatus("PENDING");
        request.setRefundEligibleAfter(LocalDateTime.now().plusDays(1));

        Map<String, Object> refundDetails = nestedMap(payload, "refundDetails");
        applyBankDetails(request, refundDetails);
        addHistory(request, "RETURN_REQUESTED", "Customer submitted return request", "CUSTOMER");

        return toReturnResponse(requestRepository.save(request));
    }

    @Override
    public Map<String, Object> createExchangeRequest(User customer, Long orderItemId, Map<String, Object> payload) throws Exception {
        OrderItem orderItem = requireCustomerOrderItem(customer, orderItemId);
        ensureNoActiveRequest(orderItemId, "EXCHANGE");

        OrderReturnExchangeRequest request = buildBaseRequest(customer, orderItem, "EXCHANGE");
        request.setStatus("EXCHANGE_REQUESTED");
        request.setReasonCode(valueAsString(payload, "exchangeReason"));
        request.setCustomerComment(valueAsString(payload, "comment"));
        request.setProductPhoto(valueAsString(payload, "productPhoto"));
        request.setRequestedVariant(valueAsString(payload, "requestedVariant"));
        request.setOldPrice(orderItem.getSellingPrice());

        Long requestedNewProductId = valueAsLong(payload, "requestedNewProductId");
        request.setRequestedNewProductId(requestedNewProductId);
        Product requestedProduct = requestedNewProductId == null
                ? orderItem.getProduct()
                : productRepository.findById(requestedNewProductId).orElse(orderItem.getProduct());
        request.setRequestedNewProductTitle(requestedProduct != null ? requestedProduct.getTitle() : null);
        request.setRequestedNewProductImage(
                requestedProduct != null && requestedProduct.getImages() != null && !requestedProduct.getImages().isEmpty()
                        ? requestedProduct.getImages().get(0)
                        : null
        );
        request.setNewPrice(requestedProduct != null ? requestedProduct.getSellingPrice() : orderItem.getSellingPrice());
        request.setPriceDifference((request.getNewPrice() == null ? 0 : request.getNewPrice())
                - (request.getOldPrice() == null ? 0 : request.getOldPrice()));

        addHistory(request, "EXCHANGE_REQUESTED", "Customer submitted exchange request", "CUSTOMER");
        return toExchangeResponse(requestRepository.save(request));
    }

    @Override
    public Map<String, Object> createReturnExchangeRequest(User customer, Long orderItemId, Map<String, Object> payload) throws Exception {
        String requestType = normalizeType(valueAsString(payload, "requestType"));
        if ("EXCHANGE".equals(requestType)) {
            return createExchangeRequest(customer, orderItemId, payload);
        }
        return createReturnRequest(customer, orderItemId, payload);
    }

    @Override
    public Map<String, Object> submitDifferencePayment(User customer, Long requestId, String paymentReference) throws Exception {
        OrderReturnExchangeRequest request = requireCustomerRequest(customer, requestId, "EXCHANGE");
        request.setPaymentReference(paymentReference);
        request.setPaymentCompletedAt(LocalDateTime.now());
        addHistory(request, "DIFFERENCE_PAYMENT_SUBMITTED", "Customer submitted exchange price difference payment", "CUSTOMER");
        return toExchangeResponse(requestRepository.save(request));
    }

    @Override
    public Map<String, Object> selectBalanceMode(User customer, Long requestId, String balanceMode) throws Exception {
        OrderReturnExchangeRequest request = requireCustomerRequest(customer, requestId, "EXCHANGE");
        String normalizedMode = firstNonBlank(balanceMode, "WALLET").toUpperCase(Locale.ROOT);
        request.setBalanceMode(normalizedMode);
        if ("WALLET".equals(normalizedMode)) {
            request.setWalletCreditStatus("PENDING");
        } else {
            request.setBankRefundStatus("PENDING");
        }
        addHistory(request, "BALANCE_MODE_SELECTED", "Customer selected " + normalizedMode + " for exchange balance handling", "CUSTOMER");
        return toExchangeResponse(requestRepository.save(request));
    }

    @Override
    public Map<String, Object> submitBankDetails(User customer, Long requestId, Map<String, Object> payload) throws Exception {
        OrderReturnExchangeRequest request = requireCustomerRequest(customer, requestId, "EXCHANGE");
        applyBankDetails(request, payload);
        addHistory(request, "BANK_DETAILS_SUBMITTED", "Customer submitted bank details for exchange balance handling", "CUSTOMER");
        return toExchangeResponse(requestRepository.save(request));
    }

    @Override
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getAdminReturnRequests() {
        return requestRepository.findByRequestTypeOrderByRequestedAtDesc("RETURN").stream()
                .map(this::toReturnResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getSellerReturnRequests(Long sellerId) {
        return requestRepository
                .findBySellerIdAndRequestTypeOrderByRequestedAtDesc(sellerId, "RETURN")
                .stream()
                .map(this::toSellerReturnResponse)
                .toList();
    }

    @Override
    public Map<String, Object> reviewReturnRequest(Long requestId, Map<String, Object> payload) throws Exception {
        OrderReturnExchangeRequest request = requireRequest(requestId, "RETURN");
        boolean approved = Boolean.TRUE.equals(payload.get("approved"));

        request.setAdminComment(valueAsString(payload, "adminComment"));
        request.setAdminReviewedAt(LocalDateTime.now());

        if (!approved) {
            request.setStatus("RETURN_REJECTED");
            request.setRejectionReason(valueAsString(payload, "rejectionReason"));
            addHistory(request, "RETURN_REJECTED", firstNonBlank(request.getRejectionReason(), "Return request rejected"), "ADMIN");
            return toReturnResponse(requestRepository.save(request));
        }

        request.setStatus("RETURN_APPROVED");
        request.setCourierId(valueAsLong(payload, "courierId"));
        request.setCourierName(request.getCourierId() == null ? null : "Courier #" + request.getCourierId());
        request.setPickupScheduledAt(parseDateTime(payload.get("pickupScheduledAt"), LocalDateTime.now().plusDays(1)));
        addHistory(request, "RETURN_APPROVED", "Admin approved return request", "ADMIN");
        return toReturnResponse(requestRepository.save(request));
    }

    @Override
    public Map<String, Object> markReturnPickup(Long requestId, String adminComment) throws Exception {
        OrderReturnExchangeRequest request = requireRequest(requestId, "RETURN");
        requireRequestStatus(request, "RETURN_APPROVED", "Return pickup can start only after approval");
        request.setStatus("RETURN_IN_TRANSIT");
        request.setAdminComment(firstNonBlank(adminComment, request.getAdminComment()));
        request.setPickupCompletedAt(LocalDateTime.now());
        addHistory(request, "RETURN_IN_TRANSIT", "Courier picked return item from customer", "ADMIN");
        return toReturnResponse(requestRepository.save(request));
    }

    @Override
    public Map<String, Object> receiveReturn(Long requestId, Map<String, Object> payload) throws Exception {
        OrderReturnExchangeRequest request = requireRequest(requestId, "RETURN");
        requireRequestStatus(request, "RETURN_IN_TRANSIT", "Return can be received only after pickup");
        String adminComment = valueAsString(payload, "adminComment");
        String qcResult = firstNonBlank(valueAsString(payload, "qcResult"), "QC_PENDING");
        String warehouseProofUrl = valueAsString(payload, "warehouseProofUrl");
        request.setStatus("REFUND_PENDING");
        request.setAdminComment(firstNonBlank(adminComment, request.getAdminComment()));
        request.setQcResult(qcResult);
        request.setWarehouseProofUrl(firstNonBlank(warehouseProofUrl, request.getWarehouseProofUrl()));
        request.setReceivedAt(LocalDateTime.now());
        boolean restockAllowed = shouldRestockForQc(qcResult);
        if (restockAllowed) {
            Product product = requireProduct(request.getProductId());
            inventoryService.restockWarehouseFromReturn(
                    product,
                    Math.max(request.getQuantityRequested() == null ? 1 : request.getQuantityRequested(), 1),
                    request.getOrderItemId(),
                    request.getId(),
                    "RETURN",
                    "RETURNED",
                    "CUSTOMER",
                    "ADMIN",
                    "Return received and stock added back to warehouse"
            );
        }
        addHistory(
                request,
                "REFUND_PENDING",
                "Warehouse received return"
                        + (restockAllowed ? " and stock was updated" : " and stock was held from inventory")
                        + (qcResult == null ? "" : " | QC: " + qcResult),
                "ADMIN"
        );
        return toReturnResponse(requestRepository.save(request));
    }

    @Override
    public Map<String, Object> initiateRefund(Long requestId, String adminComment) throws Exception {
        OrderReturnExchangeRequest request = requireRequest(requestId, "RETURN");
        requireRequestStatus(request, "REFUND_PENDING", "Refund can be initiated only after warehouse receives the return");
        request.setStatus("REFUND_INITIATED");
        request.setAdminComment(firstNonBlank(adminComment, request.getAdminComment()));
        request.setRefundStatus("INITIATED");
        request.setRefundInitiatedAt(LocalDateTime.now());
        addHistory(request, "REFUND_INITIATED", "Admin initiated refund", "ADMIN");
        return toReturnResponse(requestRepository.save(request));
    }

    @Override
    public Map<String, Object> completeRefund(Long requestId, String adminComment) throws Exception {
        OrderReturnExchangeRequest request = requireRequest(requestId, "RETURN");
        requireRequestStatus(request, "REFUND_INITIATED", "Refund can be completed only after initiation");
        request.setStatus("RETURNED");
        request.setAdminComment(firstNonBlank(adminComment, request.getAdminComment()));
        request.setRefundStatus("COMPLETED");
        request.setRefundCompletedAt(LocalDateTime.now());
        request.setCompletedAt(LocalDateTime.now());
        addHistory(request, "RETURNED", "Refund completed and return flow closed", "ADMIN");
        OrderReturnExchangeRequest savedRequest = requestRepository.save(request);
        restoreCouponForFullyReturnedOrder(savedRequest);
        return toReturnResponse(savedRequest);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getAdminExchangeRequests() {
        return requestRepository.findByRequestTypeOrderByRequestedAtDesc("EXCHANGE").stream()
                .map(this::toExchangeResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getSellerExchangeRequests(Long sellerId) {
        return requestRepository
                .findBySellerIdAndRequestTypeOrderByRequestedAtDesc(sellerId, "EXCHANGE")
                .stream()
                .map(this::toSellerExchangeResponse)
                .toList();
    }

    @Override
    public Map<String, Object> approveExchange(Long requestId, Map<String, Object> payload) throws Exception {
        OrderReturnExchangeRequest request = requireRequest(requestId, "EXCHANGE");
        if ((request.getPriceDifference() != null && request.getPriceDifference() > 0)
                && request.getPaymentCompletedAt() == null) {
            throw new IllegalArgumentException("Customer must complete price difference payment before exchange approval");
        }

        request.setStatus("EXCHANGE_APPROVED");
        request.setAdminComment(valueAsString(payload, "adminComment"));
        request.setApprovedAt(LocalDateTime.now());
        request.setCourierId(valueAsLong(payload, "courierId"));
        request.setCourierName(request.getCourierId() == null ? null : "Courier #" + request.getCourierId());
        request.setPickupScheduledAt(parseDateTime(payload.get("pickupScheduledAt"), LocalDateTime.now().plusDays(1)));
        addHistory(request, "EXCHANGE_APPROVED", "Admin approved exchange request", "ADMIN");
        return toExchangeResponse(requestRepository.save(request));
    }

    @Override
    public Map<String, Object> markExchangePickup(Long requestId, String adminComment) throws Exception {
        OrderReturnExchangeRequest request = requireRequest(requestId, "EXCHANGE");
        requireRequestStatus(request, "EXCHANGE_APPROVED", "Exchange pickup can start only after approval");
        request.setStatus("EXCHANGE_IN_TRANSIT");
        request.setAdminComment(firstNonBlank(adminComment, request.getAdminComment()));
        request.setPickupCompletedAt(LocalDateTime.now());
        addHistory(request, "EXCHANGE_IN_TRANSIT", "Courier picked old item for exchange", "ADMIN");
        return toExchangeResponse(requestRepository.save(request));
    }

    @Override
    public Map<String, Object> receiveExchange(Long requestId, Map<String, Object> payload) throws Exception {
        OrderReturnExchangeRequest request = requireRequest(requestId, "EXCHANGE");
        requireRequestStatus(request, "EXCHANGE_IN_TRANSIT", "Exchange item can be received only after pickup");
        String adminComment = valueAsString(payload, "adminComment");
        String qcResult = firstNonBlank(valueAsString(payload, "qcResult"), "QC_PENDING");
        String warehouseProofUrl = valueAsString(payload, "warehouseProofUrl");
        request.setStatus("EXCHANGE_RECEIVED");
        request.setAdminComment(firstNonBlank(adminComment, request.getAdminComment()));
        request.setQcResult(qcResult);
        request.setWarehouseProofUrl(firstNonBlank(warehouseProofUrl, request.getWarehouseProofUrl()));
        request.setReceivedAt(LocalDateTime.now());
        boolean restockAllowed = shouldRestockForQc(qcResult);
        if (restockAllowed) {
            Product returnedProduct = requireProduct(request.getProductId());
            inventoryService.restockWarehouseFromReturn(
                    returnedProduct,
                    Math.max(request.getQuantityRequested() == null ? 1 : request.getQuantityRequested(), 1),
                    request.getOrderItemId(),
                    request.getId(),
                    "EXCHANGE",
                    "EXCHANGE_RECEIVED",
                    "CUSTOMER",
                    "ADMIN",
                    "Exchange item received and stock added back to warehouse"
            );
        }
        addHistory(
                request,
                "EXCHANGE_RECEIVED",
                "Warehouse received old item for exchange"
                        + (restockAllowed ? " and stock was updated" : " and stock was held from inventory")
                        + (qcResult == null ? "" : " | QC: " + qcResult),
                "ADMIN"
        );
        return toExchangeResponse(requestRepository.save(request));
    }

    @Override
    public Map<String, Object> rejectExchange(Long requestId, String adminComment) throws Exception {
        OrderReturnExchangeRequest request = requireRequest(requestId, "EXCHANGE");
        request.setStatus("EXCHANGE_REJECTED");
        request.setAdminComment(firstNonBlank(adminComment, request.getAdminComment()));
        addHistory(request, "EXCHANGE_REJECTED", firstNonBlank(request.getAdminComment(), "Exchange request rejected"), "ADMIN");
        return toExchangeResponse(requestRepository.save(request));
    }

    @Override
    public Map<String, Object> createReplacementOrder(Long requestId, Map<String, Object> payload) throws Exception {
        OrderReturnExchangeRequest request = requireRequest(requestId, "EXCHANGE");
        requireRequestStatus(request, "EXCHANGE_RECEIVED", "Replacement can be shipped only after warehouse receives the old item");
        String adminComment = valueAsString(payload, "adminComment");
        String replacementProofUrl = valueAsString(payload, "replacementProofUrl");
        Product replacementProduct = requireProduct(
                request.getRequestedNewProductId() != null ? request.getRequestedNewProductId() : request.getProductId()
        );

        inventoryService.shipExchangeFromWarehouse(
                replacementProduct,
                Math.max(request.getQuantityRequested() == null ? 1 : request.getQuantityRequested(), 1),
                request.getOrderItemId(),
                request.getId(),
                "Replacement order shipped from warehouse"
        );

        request.setStatus("EXCHANGE_SHIPPED");
        request.setAdminComment(firstNonBlank(adminComment, request.getAdminComment()));
        request.setReplacementOrderId(System.currentTimeMillis());
        request.setReplacementCreatedAt(LocalDateTime.now());
        request.setReplacementShippedAt(LocalDateTime.now());
        request.setReplacementProofUrl(firstNonBlank(replacementProofUrl, request.getReplacementProofUrl()));

        if (request.getPriceDifference() != null && request.getPriceDifference() < 0) {
            if ("WALLET".equalsIgnoreCase(request.getBalanceMode())) {
                request.setWalletCreditStatus("COMPLETED");
                request.setWalletCreditCompletedAt(LocalDateTime.now());
            } else if ("BANK_TRANSFER".equalsIgnoreCase(request.getBalanceMode())) {
                request.setBankRefundStatus("INITIATED");
                request.setBankRefundInitiatedAt(LocalDateTime.now());
            }
        }

        addHistory(
                request,
                "EXCHANGE_SHIPPED",
                "Replacement order shipped from warehouse"
                        + (request.getReplacementProofUrl() == null ? "" : " | Proof attached"),
                "ADMIN"
        );
        return toExchangeResponse(requestRepository.save(request));
    }

    @Override
    public Map<String, Object> completeReplacementDelivery(Long requestId, String adminComment) throws Exception {
        OrderReturnExchangeRequest request = requireRequest(requestId, "EXCHANGE");
        requireRequestStatus(request, "EXCHANGE_SHIPPED", "Replacement delivery can be completed only after shipment");
        request.setStatus("EXCHANGE_COMPLETED");
        request.setAdminComment(firstNonBlank(adminComment, request.getAdminComment()));
        request.setReplacementDeliveredAt(LocalDateTime.now());
        request.setCompletedAt(LocalDateTime.now());
        addHistory(request, "EXCHANGE_COMPLETED", "Replacement delivered to customer", "ADMIN");
        return toExchangeResponse(requestRepository.save(request));
    }

    private OrderReturnExchangeRequest buildBaseRequest(User customer, OrderItem orderItem, String requestType) {
        OrderReturnExchangeRequest request = new OrderReturnExchangeRequest();
        request.setRequestNumber(nextRequestNumber(requestType));
        request.setRequestType(requestType);
        request.setOrderId(orderItem.getOrder() == null ? null : orderItem.getOrder().getId());
        request.setOrderItemId(orderItem.getId());
        request.setCustomerId(customer.getId());
        request.setCustomerName(customer.getFullName());
        request.setSellerId(
                orderItem.getProduct() != null && orderItem.getProduct().getSeller() != null
                        ? orderItem.getProduct().getSeller().getId()
                        : null
        );
        request.setProductId(orderItem.getProduct() == null ? null : orderItem.getProduct().getId());
        request.setProductTitle(orderItem.getProduct() == null ? null : orderItem.getProduct().getTitle());
        request.setProductImage(
                orderItem.getProduct() != null && orderItem.getProduct().getImages() != null && !orderItem.getProduct().getImages().isEmpty()
                        ? orderItem.getProduct().getImages().get(0)
                        : null
        );
        request.setOldPrice(orderItem.getSellingPrice());
        request.setQuantityRequested(1);
        request.setRequestedAt(LocalDateTime.now());
        return request;
    }

    private void ensureNoActiveRequest(Long orderItemId, String requestType) {
        List<OrderReturnExchangeRequest> existing = requestRepository
                .findByOrderItemIdAndRequestTypeOrderByRequestedAtDesc(orderItemId, requestType);
        if (existing.isEmpty()) {
            return;
        }

        OrderReturnExchangeRequest latest = existing.get(0);
        boolean active = "RETURN".equals(requestType)
                ? !FINAL_RETURN_STATUSES.contains(normalizeType(latest.getStatus()))
                : !FINAL_EXCHANGE_STATUSES.contains(normalizeType(latest.getStatus()));
        if (active) {
            throw new IllegalArgumentException(requestType + " request already exists for this order item");
        }
    }

    private void requireRequestStatus(OrderReturnExchangeRequest request, String expectedStatus, String message) {
        if (!expectedStatus.equalsIgnoreCase(firstNonBlank(request.getStatus(), ""))) {
            throw new IllegalArgumentException(message);
        }
    }

    private OrderItem requireCustomerOrderItem(User customer, Long orderItemId) throws Exception {
        OrderItem orderItem = orderItemRepository.findDetailedById(orderItemId)
                .orElseThrow(() -> new Exception("Order item not found"));
        if (orderItem.getOrder() == null
                || orderItem.getOrder().getUser() == null
                || !customer.getId().equals(orderItem.getOrder().getUser().getId())) {
            throw new Exception("Unauthorized order item access");
        }
        return orderItem;
    }

    private OrderReturnExchangeRequest requireCustomerRequest(User customer, Long requestId, String requestType) throws Exception {
        OrderReturnExchangeRequest request = requireRequest(requestId, requestType);
        if (!customer.getId().equals(request.getCustomerId())) {
            throw new Exception("Unauthorized request access");
        }
        return request;
    }

    private OrderReturnExchangeRequest requireRequest(Long requestId, String requestType) throws Exception {
        OrderReturnExchangeRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new Exception("Request not found"));
        if (!normalizeType(requestType).equals(normalizeType(request.getRequestType()))) {
            throw new Exception("Request not found");
        }
        return request;
    }

    private Product requireProduct(Long productId) throws Exception {
        if (productId == null) {
            throw new Exception("Product not found");
        }
        return productRepository.findById(productId).orElseThrow(() -> new Exception("Product not found"));
    }

    private void restoreCouponForFullyReturnedOrder(OrderReturnExchangeRequest request) {
        if (request == null || request.getOrderId() == null) {
            return;
        }
        Order order = orderRepository.findById(request.getOrderId()).orElse(null);
        if (order == null || order.getCouponCode() == null || order.getCouponCode().isBlank()) {
            return;
        }
        if (order.getOrderItems() == null || order.getOrderItems().isEmpty()) {
            return;
        }

        List<OrderReturnExchangeRequest> returnRequests = requestRepository
                .findByOrderIdAndRequestTypeOrderByRequestedAtDesc(order.getId(), "RETURN");
        if (returnRequests.isEmpty()) {
            return;
        }

        LinkedHashMap<Long, String> latestStatusByItem = new LinkedHashMap<>();
        for (OrderReturnExchangeRequest row : returnRequests) {
            if (row.getOrderItemId() == null || latestStatusByItem.containsKey(row.getOrderItemId())) {
                continue;
            }
            latestStatusByItem.put(row.getOrderItemId(), normalizeType(row.getStatus()));
        }

        boolean allItemsReturned = order.getOrderItems().stream()
                .map(OrderItem::getId)
                .allMatch(itemId -> "RETURNED".equals(latestStatusByItem.get(itemId)));

        if (!allItemsReturned) {
            return;
        }

        couponService.restoreCouponUsageForCancelledOrders(
                order.getUser(),
                List.of(order),
                "Coupon restored after full order return and completed refund"
        );
    }

    private void applyBankDetails(OrderReturnExchangeRequest request, Map<String, Object> payload) {
        if (payload == null || payload.isEmpty()) {
            return;
        }
        request.setBankAccountHolderName(firstNonBlank(valueAsString(payload, "accountHolderName"), request.getBankAccountHolderName()));
        request.setBankAccountNumber(firstNonBlank(valueAsString(payload, "accountNumber"), request.getBankAccountNumber()));
        request.setBankIfscCode(firstNonBlank(valueAsString(payload, "ifscCode"), request.getBankIfscCode()));
        request.setBankName(firstNonBlank(valueAsString(payload, "bankName"), request.getBankName()));
        request.setBankUpiId(firstNonBlank(valueAsString(payload, "upiId"), request.getBankUpiId()));
    }

    private void addHistory(OrderReturnExchangeRequest request, String status, String note, String updatedBy) {
        if (request.getHistory() == null) {
            request.setHistory(new ArrayList<>());
        }
        RequestHistoryEntry entry = new RequestHistoryEntry();
        entry.setStatus(status);
        entry.setNote(note);
        entry.setUpdatedBy(updatedBy);
        entry.setCreatedAt(LocalDateTime.now());
        request.getHistory().add(entry);
    }

    private String nextRequestNumber(String requestType) {
        return "%s-%d".formatted(
                "EXCHANGE".equals(requestType) ? "EXC" : "RET",
                System.currentTimeMillis()
        );
    }

    private String normalizeType(String value) {
        return value == null ? "" : value.trim().toUpperCase(Locale.ROOT);
    }

    private String firstNonBlank(String first, String second) {
        if (first != null && !first.isBlank()) {
            return first.trim();
        }
        if (second != null && !second.isBlank()) {
            return second.trim();
        }
        return null;
    }

    private boolean shouldRestockForQc(String qcResult) {
        return "QC_PASS".equalsIgnoreCase(firstNonBlank(qcResult, ""));
    }

    private String valueAsString(Map<String, Object> payload, String key) {
        if (payload == null) {
            return null;
        }
        Object value = payload.get(key);
        return value == null ? null : String.valueOf(value);
    }

    private Long valueAsLong(Map<String, Object> payload, String key) {
        if (payload == null) {
            return null;
        }
        Object value = payload.get(key);
        if (value == null) {
            return null;
        }
        if (value instanceof Number number) {
            return number.longValue();
        }
        try {
            return Long.parseLong(String.valueOf(value));
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> nestedMap(Map<String, Object> payload, String key) {
        if (payload == null) {
            return Map.of();
        }
        Object value = payload.get(key);
        if (value instanceof Map<?, ?> map) {
            return (Map<String, Object>) map;
        }
        return Map.of();
    }

    private LocalDateTime parseDateTime(Object value, LocalDateTime fallback) {
        if (value == null) {
            return fallback;
        }
        try {
            return LocalDateTime.parse(String.valueOf(value).replace("Z", ""));
        } catch (DateTimeParseException ex) {
            return fallback;
        }
    }

    private Map<String, Object> toCombinedResponse(OrderReturnExchangeRequest request) {
        return "EXCHANGE".equalsIgnoreCase(request.getRequestType())
                ? toExchangeResponse(request)
                : toReturnResponse(request);
    }

    private Map<String, Object> toSellerReturnResponse(OrderReturnExchangeRequest request) {
        LinkedHashMap<String, Object> response = new LinkedHashMap<>();
        response.put("id", request.getId());
        response.put("requestNumber", request.getRequestNumber());
        response.put("orderId", request.getOrderId());
        response.put("orderItemId", request.getOrderItemId());
        response.put("customerName", maskCustomerName(request.getCustomerName()));
        response.put("status", request.getStatus());
        response.put("requestType", request.getRequestType());
        response.put("quantityRequested", request.getQuantityRequested());
        response.put("returnReason", request.getReasonCode());
        response.put("productTitle", request.getProductTitle());
        response.put("productImage", request.getProductImage());
        response.put("requestedAt", request.getRequestedAt());
        response.put("adminReviewedAt", request.getAdminReviewedAt());
        response.put("pickupScheduledAt", request.getPickupScheduledAt());
        response.put("receivedAt", request.getReceivedAt());
        response.put("completedAt", request.getCompletedAt());
        response.put("taxAdjustment", orderAftercareTaxAdjustmentService.buildReturnTaxAdjustment(request));
        response.put("history", toHistory(request));
        return response;
    }

    private Map<String, Object> toSellerExchangeResponse(OrderReturnExchangeRequest request) {
        LinkedHashMap<String, Object> response = new LinkedHashMap<>();
        response.put("id", request.getId());
        response.put("requestNumber", request.getRequestNumber());
        response.put("oldOrderId", request.getOrderId());
        response.put("oldOrderItemId", request.getOrderItemId());
        response.put("customerName", maskCustomerName(request.getCustomerName()));
        response.put("status", request.getStatus());
        response.put("oldProductTitle", request.getProductTitle());
        response.put("oldProductImage", request.getProductImage());
        response.put("newProductTitle", request.getRequestedNewProductTitle());
        response.put("newProductImage", request.getRequestedNewProductImage());
        response.put("exchangeReason", request.getReasonCode());
        response.put("requestedAt", request.getRequestedAt());
        response.put("approvedAt", request.getApprovedAt());
        response.put("pickupScheduledAt", request.getPickupScheduledAt());
        response.put("receivedAt", request.getReceivedAt());
        response.put("paymentCompletedAt", request.getPaymentCompletedAt());
        response.put("exchangeCompletedAt", request.getCompletedAt());

        LinkedHashMap<String, Object> priceSummary = new LinkedHashMap<>();
        priceSummary.put("oldPrice", request.getOldPrice());
        priceSummary.put("newPrice", request.getNewPrice());
        priceSummary.put("priceDifference", request.getPriceDifference());
        response.put("priceSummary", priceSummary);

        LinkedHashMap<String, Object> replacementOrder = new LinkedHashMap<>();
        replacementOrder.put("id", request.getReplacementOrderId());
        replacementOrder.put("status", request.getStatus());
        replacementOrder.put("createdAt", request.getReplacementCreatedAt());
        replacementOrder.put("shippedAt", request.getReplacementShippedAt());
        replacementOrder.put("proofUrl", request.getReplacementProofUrl());
        replacementOrder.put("deliveredAt", request.getReplacementDeliveredAt());
        response.put("replacementOrder", replacementOrder);
        response.put("taxAdjustment", orderAftercareTaxAdjustmentService.buildExchangeTaxAdjustment(request));
        response.put("history", toHistory(request));
        return response;
    }

    private Map<String, Object> toReturnResponse(OrderReturnExchangeRequest request) {
        LinkedHashMap<String, Object> response = new LinkedHashMap<>();
        response.put("id", request.getId());
        response.put("requestNumber", request.getRequestNumber());
        response.put("orderId", request.getOrderId());
        response.put("orderItemId", request.getOrderItemId());
        response.put("customerId", request.getCustomerId());
        response.put("customerName", request.getCustomerName());
        response.put("sellerId", request.getSellerId());
        response.put("requestType", request.getRequestType());
        response.put("status", request.getStatus());
        response.put("quantityRequested", request.getQuantityRequested());
        response.put("reasonCode", request.getReasonCode());
        response.put("returnReason", request.getReasonCode());
        response.put("customerComment", request.getCustomerComment());
        response.put("comment", request.getCustomerComment());
        response.put("adminComment", request.getAdminComment());
        response.put("rejectionReason", request.getRejectionReason());
        response.put("courierId", request.getCourierId());
        response.put("courierName", request.getCourierName());
        response.put("productTitle", request.getProductTitle());
        response.put("productImage", request.getProductImage());
        response.put("itemSellingPrice", request.getOldPrice());
        response.put("requestedAt", request.getRequestedAt());
        response.put("adminReviewedAt", request.getAdminReviewedAt());
        response.put("pickupScheduledAt", request.getPickupScheduledAt());
        response.put("pickupCompletedAt", request.getPickupCompletedAt());
        response.put("pickedAt", request.getPickupCompletedAt());
        response.put("receivedAt", request.getReceivedAt());
        response.put("qcResult", request.getQcResult());
        response.put("warehouseProofUrl", request.getWarehouseProofUrl());
        response.put("refundPendingAt", request.getAdminReviewedAt());
        response.put("refundInitiatedAt", request.getRefundInitiatedAt());
        response.put("refundCompletedAt", request.getRefundCompletedAt());
        response.put("completedAt", request.getCompletedAt());

        LinkedHashMap<String, Object> refund = new LinkedHashMap<>();
        refund.put("eligibleAfter", request.getRefundEligibleAfter());
        refund.put("status", request.getRefundStatus());
        response.put("refund", refund);
        response.put("taxAdjustment", orderAftercareTaxAdjustmentService.buildReturnTaxAdjustment(request));
        response.put("history", toHistory(request));
        return response;
    }

    private Map<String, Object> toExchangeResponse(OrderReturnExchangeRequest request) {
        LinkedHashMap<String, Object> response = new LinkedHashMap<>();
        response.put("id", request.getId());
        response.put("requestNumber", request.getRequestNumber());
        response.put("oldOrderId", request.getOrderId());
        response.put("oldOrderItemId", request.getOrderItemId());
        response.put("customerId", request.getCustomerId());
        response.put("customerName", request.getCustomerName());
        response.put("oldProductId", request.getProductId());
        response.put("oldProductTitle", request.getProductTitle());
        response.put("oldProductImage", request.getProductImage());
        response.put("newProductId", request.getRequestedNewProductId());
        response.put("newProductTitle", request.getRequestedNewProductTitle());
        response.put("newProductImage", request.getRequestedNewProductImage());
        response.put("requestedVariant", request.getRequestedVariant());
        response.put("exchangeReason", request.getReasonCode());
        response.put("comment", request.getCustomerComment());
        response.put("productPhoto", request.getProductPhoto());
        response.put("status", request.getStatus());
        response.put("oldPrice", request.getOldPrice());
        response.put("newPrice", request.getNewPrice());
        response.put("priceDifference", request.getPriceDifference());
        response.put("courierId", request.getCourierId());
        response.put("courierName", request.getCourierName());
        response.put("adminComment", request.getAdminComment());
        response.put("rejectionReason", request.getRejectionReason());
        response.put("requestedAt", request.getRequestedAt());
        response.put("approvedAt", request.getApprovedAt());
        response.put("pickupScheduledAt", request.getPickupScheduledAt());
        response.put("oldItemPickedAt", request.getPickupCompletedAt());
        response.put("pickupCompletedAt", request.getPickupCompletedAt());
        response.put("paymentCompletedAt", request.getPaymentCompletedAt());
        response.put("receivedAt", request.getReceivedAt());
        response.put("qcResult", request.getQcResult());
        response.put("warehouseProofUrl", request.getWarehouseProofUrl());
        response.put("walletCreditCompletedAt", request.getWalletCreditCompletedAt());
        response.put("bankRefundInitiatedAt", request.getBankRefundInitiatedAt());
        response.put("bankRefundCompletedAt", request.getBankRefundCompletedAt());
        response.put("exchangeCompletedAt", request.getCompletedAt());

        LinkedHashMap<String, Object> bankDetails = new LinkedHashMap<>();
        bankDetails.put("accountHolderName", request.getBankAccountHolderName());
        bankDetails.put("accountNumber", request.getBankAccountNumber());
        bankDetails.put("ifscCode", request.getBankIfscCode());
        bankDetails.put("bankName", request.getBankName());
        bankDetails.put("upiId", request.getBankUpiId());
        response.put("bankDetails", bankDetails);

        LinkedHashMap<String, Object> priceSummary = new LinkedHashMap<>();
        priceSummary.put("oldPrice", request.getOldPrice());
        priceSummary.put("newPrice", request.getNewPrice());
        priceSummary.put("priceDifference", request.getPriceDifference());
        priceSummary.put("customerPaymentRequired", request.getPriceDifference() != null && request.getPriceDifference() > 0);
        priceSummary.put("customerRefundRequired", request.getPriceDifference() != null && request.getPriceDifference() < 0);
        priceSummary.put("balanceMode", request.getBalanceMode());
        response.put("priceSummary", priceSummary);

        LinkedHashMap<String, Object> balanceHandling = new LinkedHashMap<>();
        balanceHandling.put("status", request.getStatus());
        balanceHandling.put("paymentReference", request.getPaymentReference());
        balanceHandling.put("walletCreditStatus", request.getWalletCreditStatus());
        balanceHandling.put("bankRefundStatus", request.getBankRefundStatus());
        balanceHandling.put("bankDetails", bankDetails);
        response.put("balanceHandling", balanceHandling);

        LinkedHashMap<String, Object> exchangePickup = new LinkedHashMap<>();
        exchangePickup.put("status", request.getStatus());
        exchangePickup.put("exchangeStatus", request.getStatus());
        exchangePickup.put("scheduledAt", request.getPickupScheduledAt());
        exchangePickup.put("oldItemPickedAt", request.getPickupCompletedAt());
        exchangePickup.put("completedAt", request.getReceivedAt());
        exchangePickup.put("pickupPhoto", request.getProductPhoto());
        exchangePickup.put("warehouseProofUrl", request.getWarehouseProofUrl());
        exchangePickup.put("qcResult", request.getQcResult());
        exchangePickup.put("note", request.getAdminComment());
        response.put("exchangePickup", exchangePickup);

        LinkedHashMap<String, Object> replacementOrder = new LinkedHashMap<>();
        replacementOrder.put("id", request.getReplacementOrderId());
        replacementOrder.put("replacementOrderNumber",
                request.getReplacementOrderId() == null ? null : "RPL-" + request.getReplacementOrderId());
        replacementOrder.put("status", request.getStatus());
        replacementOrder.put("createdAt", request.getReplacementCreatedAt());
        replacementOrder.put("shippedAt", request.getReplacementShippedAt());
        replacementOrder.put("proofUrl", request.getReplacementProofUrl());
        replacementOrder.put("deliveredAt", request.getReplacementDeliveredAt());
        response.put("replacementOrder", replacementOrder);
        response.put("taxAdjustment", orderAftercareTaxAdjustmentService.buildExchangeTaxAdjustment(request));
        response.put("history", toHistory(request));
        return response;
    }

    private List<Map<String, Object>> toHistory(OrderReturnExchangeRequest request) {
        if (request.getHistory() == null) {
            return List.of();
        }
        return request.getHistory().stream().map(entry -> {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("status", entry.getStatus());
            item.put("note", entry.getNote());
            item.put("updatedBy", entry.getUpdatedBy());
            item.put("createdAt", entry.getCreatedAt());
            return item;
        }).toList();
    }

    private String maskCustomerName(String value) {
        if (value == null || value.isBlank()) {
            return "Customer";
        }
        String trimmed = value.trim();
        if (trimmed.length() == 1) {
            return trimmed + "***";
        }
        return trimmed.charAt(0) + "***";
    }
}





