package com.example.ecommerce.inventory.service.impl;

import com.example.ecommerce.inventory.service.RestockNotificationService;
import com.example.ecommerce.modal.Product;
import com.example.ecommerce.modal.ProductRestockNotificationLog;
import com.example.ecommerce.modal.ProductRestockSubscription;
import com.example.ecommerce.modal.User;
import com.example.ecommerce.repository.ProductRestockNotificationLogRepository;
import com.example.ecommerce.repository.ProductRestockSubscriptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional
public class RestockNotificationServiceImpl implements RestockNotificationService {

    private static final String STATUS_SUBSCRIBED = "SUBSCRIBED";
    private static final String STATUS_NOTIFIED = "NOTIFIED";
    private static final String STATUS_CONVERTED = "CONVERTED";
    private static final String STATUS_ALREADY_NOTIFIED = "ALREADY_NOTIFIED";
    private static final String STATUS_NONE = "NONE";

    private final ProductRestockSubscriptionRepository subscriptionRepository;
    private final ProductRestockNotificationLogRepository notificationLogRepository;

    @Override
    public Map<String, Object> subscribe(User user, Product product) {
        if (product.getWarehouseStock() > 0) {
            throw new IllegalArgumentException("Product is already in stock");
        }

        ProductRestockSubscription existing = subscriptionRepository
                .findTopByProductIdAndUserIdOrderByCreatedAtDesc(product.getId(), user.getId())
                .orElse(null);

        if (existing != null) {
            if (STATUS_SUBSCRIBED.equals(existing.getStatus())) {
                return toResponse(existing, "Already subscribed for this product", STATUS_SUBSCRIBED);
            }
            return toResponse(existing, "You were already notified for this product", STATUS_ALREADY_NOTIFIED);
        }

        ProductRestockSubscription subscription = new ProductRestockSubscription();
        subscription.setProduct(product);
        subscription.setUser(user);
        subscription.setStatus(STATUS_SUBSCRIBED);
        subscription.setCreatedAt(LocalDateTime.now());
        ProductRestockSubscription savedSubscription = subscriptionRepository.save(subscription);
        return toResponse(savedSubscription, "Notify subscription saved", STATUS_SUBSCRIBED);
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getSubscriptionStatus(User user, Product product) {
        ProductRestockSubscription existing = subscriptionRepository
                .findTopByProductIdAndUserIdOrderByCreatedAtDesc(product.getId(), user.getId())
                .orElse(null);
        if (existing == null) {
            return Map.of(
                    "productId", product.getId(),
                    "status", STATUS_NONE,
                    "subscribed", false
            );
        }
        return toResponse(existing, null, existing.getStatus());
    }

    @Override
    public void notifySubscribersIfRestocked(Product product) {
        if (product == null || product.getId() == null || product.getWarehouseStock() <= 0) {
            return;
        }

        List<ProductRestockSubscription> subscriptions =
                subscriptionRepository.findByProductIdAndStatusOrderByCreatedAtAsc(product.getId(), STATUS_SUBSCRIBED);

        for (ProductRestockSubscription subscription : subscriptions) {
            subscription.setStatus(STATUS_NOTIFIED);
            subscription.setNotifiedAt(LocalDateTime.now());
            ProductRestockSubscription savedSubscription = subscriptionRepository.save(subscription);

            ProductRestockNotificationLog log = new ProductRestockNotificationLog();
            log.setSubscription(savedSubscription);
            log.setProduct(product);
            log.setUser(savedSubscription.getUser());
            log.setStatus(STATUS_NOTIFIED);
            log.setNote("Warehouse stock is available again for this product");
            log.setCreatedAt(LocalDateTime.now());
            notificationLogRepository.save(log);
        }
    }

    @Override
    public Map<String, Object> triggerManualNotification(Product product, String note) {
        if (product == null || product.getId() == null) {
            throw new IllegalArgumentException("Product not found");
        }
        if (product.getWarehouseStock() <= 0) {
            throw new IllegalArgumentException("Warehouse stock must be available before notifying users");
        }

        List<ProductRestockSubscription> subscriptions =
                subscriptionRepository.findByProductIdAndStatusOrderByCreatedAtAsc(product.getId(), STATUS_SUBSCRIBED);

        int notified = 0;
        for (ProductRestockSubscription subscription : subscriptions) {
            subscription.setStatus(STATUS_NOTIFIED);
            subscription.setNotifiedAt(LocalDateTime.now());
            ProductRestockSubscription savedSubscription = subscriptionRepository.save(subscription);

            ProductRestockNotificationLog log = new ProductRestockNotificationLog();
            log.setSubscription(savedSubscription);
            log.setProduct(product);
            log.setUser(savedSubscription.getUser());
            log.setStatus(STATUS_NOTIFIED);
            log.setNote(
                    note == null || note.isBlank()
                            ? "Manual restock notification triggered by admin"
                            : note.trim()
            );
            log.setCreatedAt(LocalDateTime.now());
            notificationLogRepository.save(log);
            notified++;
        }

        LinkedHashMap<String, Object> response = new LinkedHashMap<>();
        response.put("productId", product.getId());
        response.put("status", STATUS_NOTIFIED);
        response.put("notifiedCount", notified);
        response.put(
                "message",
                notified == 0
                        ? "No subscribed users were waiting for this product"
                        : "Manual notifications sent successfully"
        );
        return response;
    }

    @Override
    public void markSubscriptionConverted(User user, Product product) {
        if (user == null || user.getId() == null || product == null || product.getId() == null) {
            return;
        }

        subscriptionRepository.findTopByProductIdAndUserIdOrderByCreatedAtDesc(product.getId(), user.getId())
                .ifPresent(subscription -> {
                    if (STATUS_SUBSCRIBED.equals(subscription.getStatus()) || STATUS_NOTIFIED.equals(subscription.getStatus())) {
                        subscription.setStatus(STATUS_CONVERTED);
                        subscription.setConvertedAt(LocalDateTime.now());
                        subscriptionRepository.save(subscription);
                    }
                });
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getAdminDemandInsights() {
        return buildDemandInsights(null);
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getSellerDemandInsights(Long sellerId) {
        return buildDemandInsights(sellerId);
    }

    private Map<String, Object> buildDemandInsights(Long sellerId) {
        List<ProductRestockSubscription> subscriptions = subscriptionRepository.findAll();
        List<ProductRestockNotificationLog> logs = notificationLogRepository.findAll();

        Map<Long, LinkedHashMap<String, Object>> productDemand = new HashMap<>();
        int subscribedCount = 0;
        int notifiedCount = 0;
        int convertedCount = 0;

        for (ProductRestockSubscription subscription : subscriptions) {
            Product product = subscription.getProduct();
            if (product == null || product.getId() == null || !belongsToSeller(product, sellerId)) {
                continue;
            }

            LinkedHashMap<String, Object> demand = productDemand.computeIfAbsent(
                    product.getId(),
                    ignored -> createProductDemandRow(product)
            );

            String status = (subscription.getStatus() == null ? STATUS_NONE : subscription.getStatus()).toUpperCase();
            if (STATUS_SUBSCRIBED.equals(status)) {
                subscribedCount++;
                demand.put("subscribedCount", ((Number) demand.get("subscribedCount")).intValue() + 1);
            } else if (STATUS_NOTIFIED.equals(status)) {
                notifiedCount++;
                demand.put("notifiedCount", ((Number) demand.get("notifiedCount")).intValue() + 1);
            } else if (STATUS_CONVERTED.equals(status)) {
                convertedCount++;
                demand.put("convertedCount", ((Number) demand.get("convertedCount")).intValue() + 1);
            }

            LocalDateTime createdAt = subscription.getCreatedAt();
            LocalDateTime latestSubscribedAt = (LocalDateTime) demand.get("latestSubscribedAt");
            if (createdAt != null && (latestSubscribedAt == null || createdAt.isAfter(latestSubscribedAt))) {
                demand.put("latestSubscribedAt", createdAt);
            }

            LocalDateTime notifiedAt = subscription.getNotifiedAt();
            LocalDateTime latestNotifiedAt = (LocalDateTime) demand.get("latestNotifiedAt");
            if (notifiedAt != null && (latestNotifiedAt == null || notifiedAt.isAfter(latestNotifiedAt))) {
                demand.put("latestNotifiedAt", notifiedAt);
            }
        }

        List<Map<String, Object>> topDemandProducts = new ArrayList<>(productDemand.values());
        topDemandProducts.sort(Comparator
                .comparingInt((Map<String, Object> row) -> ((Number) row.get("subscribedCount")).intValue())
                .thenComparingInt(row -> ((Number) row.get("notifiedCount")).intValue())
                .reversed());

        List<Map<String, Object>> recentNotifications = logs.stream()
                .filter(log -> belongsToSeller(log.getProduct(), sellerId))
                .sorted(Comparator.comparing(ProductRestockNotificationLog::getCreatedAt,
                        Comparator.nullsLast(Comparator.naturalOrder())).reversed())
                .limit(8)
                .map(this::toNotificationRow)
                .toList();

        LinkedHashMap<String, Object> response = new LinkedHashMap<>();
        response.put("pendingSubscribers", subscribedCount);
        response.put("notifiedSubscribers", notifiedCount);
        response.put("convertedSubscribers", convertedCount);
        response.put("demandProducts", topDemandProducts);
        response.put("recentNotifications", recentNotifications);
        return response;
    }

    private boolean belongsToSeller(Product product, Long sellerId) {
        if (product == null) {
            return false;
        }
        if (sellerId == null) {
            return true;
        }
        return product.getSeller() != null
                && product.getSeller().getId() != null
                && product.getSeller().getId().equals(sellerId);
    }

    private LinkedHashMap<String, Object> createProductDemandRow(Product product) {
        LinkedHashMap<String, Object> row = new LinkedHashMap<>();
        row.put("productId", product.getId());
        row.put("productTitle", product.getTitle());
        row.put("warehouseStock", product.getWarehouseStock());
        row.put("sellerStock", product.getSellerStock());
        row.put("subscribedCount", 0);
        row.put("notifiedCount", 0);
        row.put("convertedCount", 0);
        row.put("latestSubscribedAt", null);
        row.put("latestNotifiedAt", null);
        return row;
    }

    private Map<String, Object> toNotificationRow(ProductRestockNotificationLog log) {
        LinkedHashMap<String, Object> row = new LinkedHashMap<>();
        row.put("id", log.getId());
        row.put("productId", log.getProduct() != null ? log.getProduct().getId() : null);
        row.put("productTitle", log.getProduct() != null ? log.getProduct().getTitle() : null);
        row.put("userId", log.getUser() != null ? log.getUser().getId() : null);
        row.put("status", log.getStatus());
        row.put("note", log.getNote());
        row.put("createdAt", log.getCreatedAt());
        return row;
    }

    private Map<String, Object> toResponse(
            ProductRestockSubscription subscription,
            String message,
            String responseStatus
    ) {
        LinkedHashMap<String, Object> response = new LinkedHashMap<>();
        response.put("id", subscription.getId());
        response.put("productId", subscription.getProduct() != null ? subscription.getProduct().getId() : null);
        response.put("userId", subscription.getUser() != null ? subscription.getUser().getId() : null);
        response.put("status", responseStatus);
        response.put("subscribed", STATUS_SUBSCRIBED.equals(subscription.getStatus()));
        response.put("notifiedAt", subscription.getNotifiedAt());
        response.put("convertedAt", subscription.getConvertedAt());
        if (message != null) {
            response.put("message", message);
        }
        return response;
    }
}
