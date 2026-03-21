package com.example.ecommerce.inventory.service.impl;

import com.example.ecommerce.inventory.service.InventoryService;
import com.example.ecommerce.modal.InventoryMovement;
import com.example.ecommerce.modal.Product;
import com.example.ecommerce.repository.InventoryMovementRepository;
import com.example.ecommerce.repository.ProductRepository;
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
public class InventoryServiceImpl implements InventoryService {

    private final ProductRepository productRepository;
    private final InventoryMovementRepository inventoryMovementRepository;

    @Override
    public Product initializeSellerOwnedStock(Product product, int initialSellerStock, String note) {
        product.setSellerStock(Math.max(initialSellerStock, 0));
        product.setWarehouseStock(0);
        Product savedProduct = productRepository.save(product);
        recordMovement(savedProduct, null, null, "PRODUCT_ADDED", "-", "SELLER",
                initialSellerStock, null, null, "SELLER", "SYSTEM", note, null);
        return savedProduct;
    }

    @Override
    public Product updateSellerStock(Product product, int sellerStock, String note) {
        product.setSellerStock(Math.max(sellerStock, 0));
        Product savedProduct = productRepository.save(product);
        recordMovement(savedProduct, null, null, "SELLER_STOCK_UPDATED", "SELLER", "SELLER",
                savedProduct.getSellerStock(), null, null, "SELLER", "SELLER", note, null);
        return savedProduct;
    }

    @Override
    public Product transferSellerStockToWarehouse(Product product, int quantity, String note) {
        if (quantity <= 0) {
            throw new IllegalArgumentException("Transfer quantity must be greater than zero");
        }
        if (product.getSellerStock() < quantity) {
            throw new IllegalArgumentException("Insufficient seller stock for warehouse transfer");
        }

        product.setSellerStock(product.getSellerStock() - quantity);
        product.setWarehouseStock(product.getWarehouseStock() + quantity);
        Product savedProduct = productRepository.save(product);
        recordMovement(savedProduct, null, null, "WAREHOUSE_TRANSFER", "SELLER", "WAREHOUSE",
                quantity, "INBOUND", null, "SELLER", "ADMIN", note, null);
        return savedProduct;
    }

    @Override
    public void deductWarehouseStockForOrder(Product product, int quantity, Long orderItemId) {
        if (quantity <= 0) {
            throw new IllegalArgumentException("Order quantity must be greater than zero");
        }
        if (product.getWarehouseStock() < quantity) {
            throw new IllegalArgumentException("Insufficient warehouse stock for " + product.getTitle());
        }

        product.setWarehouseStock(product.getWarehouseStock() - quantity);
        Product savedProduct = productRepository.save(product);
        recordMovement(savedProduct, orderItemId, null, "ORDER_PLACED", "WAREHOUSE", "CUSTOMER",
                quantity, "OUTBOUND", "PLACED", "CUSTOMER", "SYSTEM",
                "Warehouse stock deducted on order placement", null);
    }

    @Override
    public void restoreWarehouseStockFromCancellation(Product product, int quantity, Long orderItemId, String note) {
        if (quantity <= 0) {
            return;
        }
        product.setWarehouseStock(product.getWarehouseStock() + quantity);
        Product savedProduct = productRepository.save(product);
        recordMovement(savedProduct, orderItemId, null, "ORDER_CANCELLED", "ORDER", "WAREHOUSE",
                quantity, "RETURN", "CANCELLED", "CUSTOMER", "SYSTEM", note, null);
    }

    @Override
    public void restockWarehouseFromReturn(
            Product product,
            int quantity,
            Long orderItemId,
            Long requestId,
            String requestType,
            String orderStatus,
            String addedBy,
            String updatedBy,
            String note
    ) {
        if (quantity <= 0) {
            return;
        }
        product.setWarehouseStock(product.getWarehouseStock() + quantity);
        Product savedProduct = productRepository.save(product);
        recordMovement(savedProduct, orderItemId, requestId, "RETURN_RESTOCK", "CUSTOMER", "WAREHOUSE",
                quantity, "RETURN", orderStatus, addedBy, updatedBy, note, requestType);
    }

    @Override
    public void shipExchangeFromWarehouse(
            Product product,
            int quantity,
            Long orderItemId,
            Long requestId,
            String note
    ) {
        if (quantity <= 0) {
            throw new IllegalArgumentException("Exchange quantity must be greater than zero");
        }
        if (product.getWarehouseStock() < quantity) {
            throw new IllegalArgumentException("Insufficient warehouse stock for exchange shipment");
        }

        product.setWarehouseStock(product.getWarehouseStock() - quantity);
        Product savedProduct = productRepository.save(product);
        recordMovement(savedProduct, orderItemId, requestId, "EXCHANGE_SHIPPED", "WAREHOUSE", "CUSTOMER",
                quantity, "OUTBOUND", "EXCHANGE_SHIPPED", "ADMIN", "COURIER", note, "EXCHANGE");
    }

    @Override
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getMovementsForProduct(Long productId) {
        return inventoryMovementRepository.findByProductIdOrderByCreatedAtDesc(productId).stream()
                .map(this::toMovementMap)
                .toList();
    }

    private Map<String, Object> toMovementMap(InventoryMovement movement) {
        LinkedHashMap<String, Object> response = new LinkedHashMap<>();
        response.put("id", movement.getId());
        response.put("action", movement.getAction());
        response.put("from", movement.getFromLocation());
        response.put("to", movement.getToLocation());
        response.put("quantity", movement.getQuantity());
        response.put("movementType", movement.getMovementType());
        response.put("orderStatus", movement.getOrderStatus());
        response.put("requestId", movement.getRequestId());
        response.put("requestType", movement.getRequestType());
        response.put("addedBy", movement.getAddedBy());
        response.put("updatedBy", movement.getUpdatedBy());
        response.put("note", movement.getNote());
        response.put("createdAt", movement.getCreatedAt());
        return response;
    }

    private void recordMovement(
            Product product,
            Long orderItemId,
            Long requestId,
            String action,
            String fromLocation,
            String toLocation,
            Integer quantity,
            String movementType,
            String orderStatus,
            String addedBy,
            String updatedBy,
            String note,
            String requestType
    ) {
        InventoryMovement movement = new InventoryMovement();
        movement.setProduct(product);
        movement.setOrderItemId(orderItemId);
        movement.setRequestId(requestId);
        movement.setRequestType(requestType);
        movement.setAction(action);
        movement.setFromLocation(fromLocation);
        movement.setToLocation(toLocation);
        movement.setQuantity(quantity);
        movement.setMovementType(movementType);
        movement.setOrderStatus(orderStatus);
        movement.setAddedBy(addedBy);
        movement.setUpdatedBy(updatedBy);
        movement.setNote(note);
        movement.setCreatedAt(LocalDateTime.now());
        inventoryMovementRepository.save(movement);
    }
}
