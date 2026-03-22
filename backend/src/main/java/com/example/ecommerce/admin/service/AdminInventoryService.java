package com.example.ecommerce.admin.service;

import java.util.List;
import java.util.Map;

public interface AdminInventoryService {
    Map<String, Object> adjustInventory(Long productId, Map<String, Object> payload) throws Exception;

    List<Map<String, Object>> getProductMovements(Long productId) throws Exception;

    Map<String, Object> triggerRestockNotification(Long productId, String note) throws Exception;
}
