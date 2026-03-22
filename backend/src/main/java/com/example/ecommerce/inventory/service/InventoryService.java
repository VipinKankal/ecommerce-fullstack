package com.example.ecommerce.inventory.service;

import com.example.ecommerce.modal.Product;

import java.util.List;
import java.util.Map;

public interface InventoryService {
    Product initializeSellerOwnedStock(Product product, int initialSellerStock, String note);

    Product updateSellerStock(Product product, int sellerStock, String note);

    Product transferSellerStockToWarehouse(Product product, int quantity, String note);

    Product receiveSellerStockAtWarehouse(Product product, int quantity, Long requestId, String note);

    void deductWarehouseStockForOrder(Product product, int quantity, Long orderItemId);

    void restoreWarehouseStockFromCancellation(Product product, int quantity, Long orderItemId, String note);

    void restockWarehouseFromReturn(
            Product product,
            int quantity,
            Long orderItemId,
            Long requestId,
            String requestType,
            String orderStatus,
            String addedBy,
            String updatedBy,
            String note
    );

    void shipExchangeFromWarehouse(
            Product product,
            int quantity,
            Long orderItemId,
            Long requestId,
            String note
    );

    List<Map<String, Object>> getMovementsForProduct(Long productId);

    void notifySubscribersIfRestocked(Product product);
}
