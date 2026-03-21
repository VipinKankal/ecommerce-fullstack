package com.example.ecommerce.inventory.service;

import com.example.ecommerce.modal.Product;
import com.example.ecommerce.modal.User;

import java.util.Map;

public interface RestockNotificationService {
    Map<String, Object> subscribe(User user, Product product);

    Map<String, Object> getSubscriptionStatus(User user, Product product);

    void notifySubscribersIfRestocked(Product product);

    void markSubscriptionConverted(User user, Product product);
}
