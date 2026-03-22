package com.example.ecommerce.inventory.service.impl;

import com.example.ecommerce.inventory.service.InventoryService;
import com.example.ecommerce.inventory.service.RestockNotificationService;
import com.example.ecommerce.modal.InventoryMovement;
import com.example.ecommerce.modal.Product;
import com.example.ecommerce.modal.ProductVariant;
import com.example.ecommerce.repository.InventoryMovementRepository;
import com.example.ecommerce.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Comparator;

@Service
@RequiredArgsConstructor
@Transactional
public class InventoryServiceImpl implements InventoryService {

    private final ProductRepository productRepository;
    private final InventoryMovementRepository inventoryMovementRepository;
    private final RestockNotificationService restockNotificationService;

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
        int normalizedSellerStock = Math.max(sellerStock, 0);
        if (product.getVariants() != null && !product.getVariants().isEmpty()) {
            redistributeSellerStockAcrossVariants(product.getVariants(), normalizedSellerStock);
        } else {
            product.setSellerStock(normalizedSellerStock);
        }
        Product savedProduct = productRepository.save(product);
        recordMovement(savedProduct, null, null, "SELLER_STOCK_UPDATED", "SELLER", "SELLER",
                savedProduct.getSellerStock(), null, null, "SELLER", "SELLER", note, null);
        return savedProduct;
    }

    @Override
    public Product transferSellerStockToWarehouse(Product product, int quantity, String note) {
        return receiveSellerStockAtWarehouse(product, quantity, null, note);
    }

    @Override
    public Product receiveSellerStockAtWarehouse(Product product, int quantity, Long requestId, String note) {
        if (quantity <= 0) {
            throw new IllegalArgumentException("Transfer quantity must be greater than zero");
        }
        int availableSellerStock = product.getSellerStock();
        if (product.getVariants() != null && !product.getVariants().isEmpty()) {
            availableSellerStock = product.getVariants().stream()
                    .map(ProductVariant::getSellerStock)
                    .filter(java.util.Objects::nonNull)
                    .mapToInt(Integer::intValue)
                    .sum();
        }
        if (availableSellerStock < quantity) {
            throw new IllegalArgumentException("Insufficient seller stock for warehouse transfer");
        }

        if (product.getVariants() != null && !product.getVariants().isEmpty()) {
            shiftVariantStockFromSellerToWarehouse(product.getVariants(), quantity);
        } else {
            product.setSellerStock(product.getSellerStock() - quantity);
            product.setWarehouseStock(product.getWarehouseStock() + quantity);
        }
        Product savedProduct = productRepository.save(product);
        recordMovement(savedProduct, null, requestId, "WAREHOUSE_TRANSFER", "SELLER", "WAREHOUSE",
                quantity, "INBOUND", "TRANSFER_COMPLETED", "SELLER", "ADMIN", note, "TRANSFER");
        notifySubscribersIfRestocked(savedProduct);
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
        notifySubscribersIfRestocked(savedProduct);
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
        notifySubscribersIfRestocked(savedProduct);
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

    @Override
    public void notifySubscribersIfRestocked(Product product) {
        restockNotificationService.notifySubscribersIfRestocked(product);
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

    private void shiftVariantStockFromSellerToWarehouse(List<ProductVariant> variants, int quantity) {
        int remaining = quantity;
        List<ProductVariant> sortedVariants = variants.stream()
                .sorted(Comparator.comparing(
                        (ProductVariant variant) -> Math.max(variant.getSellerStock() == null ? 0 : variant.getSellerStock(), 0)
                ).reversed())
                .toList();

        for (ProductVariant variant : sortedVariants) {
            int sellerStock = Math.max(variant.getSellerStock() == null ? 0 : variant.getSellerStock(), 0);
            if (sellerStock <= 0) {
                continue;
            }
            int movable = Math.min(sellerStock, remaining);
            variant.setSellerStock(sellerStock - movable);
            int warehouseStock = Math.max(variant.getWarehouseStock() == null ? 0 : variant.getWarehouseStock(), 0);
            variant.setWarehouseStock(warehouseStock + movable);
            remaining -= movable;
            if (remaining == 0) {
                break;
            }
        }

        if (remaining > 0) {
            throw new IllegalArgumentException("Insufficient seller stock for warehouse transfer");
        }
    }

    private void redistributeSellerStockAcrossVariants(List<ProductVariant> variants, int targetSellerStock) {
        if (variants.isEmpty()) {
            return;
        }
        if (targetSellerStock <= 0) {
            variants.forEach(variant -> variant.setSellerStock(0));
            return;
        }

        int currentTotal = variants.stream()
                .map(ProductVariant::getSellerStock)
                .filter(java.util.Objects::nonNull)
                .mapToInt(Integer::intValue)
                .sum();

        if (currentTotal <= 0) {
            boolean first = true;
            for (ProductVariant variant : variants) {
                if (first) {
                    variant.setSellerStock(targetSellerStock);
                    first = false;
                } else {
                    variant.setSellerStock(0);
                }
            }
            return;
        }

        int remaining = targetSellerStock;
        for (ProductVariant variant : variants) {
            int variantStock = Math.max(variant.getSellerStock() == null ? 0 : variant.getSellerStock(), 0);
            int allocated = (int) Math.floor(((double) variantStock / currentTotal) * targetSellerStock);
            variant.setSellerStock(allocated);
            remaining -= allocated;
        }

        List<ProductVariant> sortedByCurrentStock = variants.stream()
                .sorted(Comparator.comparing(
                        (ProductVariant variant) -> Math.max(variant.getSellerStock() == null ? 0 : variant.getSellerStock(), 0)
                ).reversed())
                .toList();

        int index = 0;
        while (remaining > 0 && !sortedByCurrentStock.isEmpty()) {
            ProductVariant variant = sortedByCurrentStock.get(index % sortedByCurrentStock.size());
            int sellerStock = Math.max(variant.getSellerStock() == null ? 0 : variant.getSellerStock(), 0);
            variant.setSellerStock(sellerStock + 1);
            remaining--;
            index++;
        }
    }
}
