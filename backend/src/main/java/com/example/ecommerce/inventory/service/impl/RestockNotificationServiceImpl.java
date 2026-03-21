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
