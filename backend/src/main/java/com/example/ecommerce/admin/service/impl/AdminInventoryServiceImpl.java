package com.example.ecommerce.admin.service.impl;

import com.example.ecommerce.admin.service.AdminInventoryService;
import com.example.ecommerce.inventory.service.InventoryService;
import com.example.ecommerce.inventory.service.RestockNotificationService;
import com.example.ecommerce.modal.InventoryMovement;
import com.example.ecommerce.modal.Product;
import com.example.ecommerce.modal.ProductVariant;
import com.example.ecommerce.repository.InventoryMovementRepository;
import com.example.ecommerce.repository.ProductRepository;
import com.example.ecommerce.repository.ProductVariantRepository;
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
public class AdminInventoryServiceImpl implements AdminInventoryService {

    private final ProductRepository productRepository;
    private final ProductVariantRepository productVariantRepository;
    private final InventoryMovementRepository inventoryMovementRepository;
    private final InventoryService inventoryService;
    private final RestockNotificationService restockNotificationService;

    @Override
    public Map<String, Object> adjustInventory(Long productId, Map<String, Object> payload) throws Exception {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new Exception("Product not found"));
        int previousWarehouseStock = Math.max(product.getWarehouseStock(), 0);
        int previousSellerStock = Math.max(product.getSellerStock(), 0);

        Long variantId = parseLong(payload.get("variantId"));
        Integer nextSellerStock = parseInteger(payload.get("sellerStock"));
        Integer nextWarehouseStock = parseInteger(payload.get("warehouseStock"));
        Integer nextLowStockThreshold = parseInteger(payload.get("lowStockThreshold"));
        String note = payload.get("note") == null ? "Admin stock adjustment" : String.valueOf(payload.get("note"));

        ProductVariant variant = null;
        if (variantId != null) {
            variant = productVariantRepository.findById(variantId)
                    .orElseThrow(() -> new Exception("Variant not found"));
            if (variant.getProduct() == null || !productId.equals(variant.getProduct().getId())) {
                throw new IllegalArgumentException("Variant does not belong to the selected product");
            }

            if (nextSellerStock != null) {
                variant.setSellerStock(Math.max(nextSellerStock, 0));
            }
            if (nextWarehouseStock != null) {
                variant.setWarehouseStock(Math.max(nextWarehouseStock, 0));
            }
            productVariantRepository.save(variant);
            product.setVariants(productVariantRepository.findByProductId(productId));
        } else {
            boolean hasVariants = !productVariantRepository.findByProductId(productId).isEmpty();
            if (hasVariants && (nextSellerStock != null || nextWarehouseStock != null)) {
                throw new IllegalArgumentException("Select a variant to adjust stock for this product");
            }
            if (nextSellerStock != null) {
                product.setSellerStock(Math.max(nextSellerStock, 0));
            }
            if (nextWarehouseStock != null) {
                product.setWarehouseStock(Math.max(nextWarehouseStock, 0));
            }
        }

        if (nextLowStockThreshold != null) {
            product.setLowStockThreshold(Math.max(nextLowStockThreshold, 0));
        }

        Product savedProduct = productRepository.save(product);
        int currentSellerStock = Math.max(savedProduct.getSellerStock(), 0);
        int currentWarehouseStock = Math.max(savedProduct.getWarehouseStock(), 0);

        if (currentSellerStock != previousSellerStock) {
            recordAdjustmentMovement(
                    savedProduct,
                    currentSellerStock - previousSellerStock,
                    "SELLER",
                    note,
                    variant
            );
        }

        if (currentWarehouseStock != previousWarehouseStock) {
            recordAdjustmentMovement(
                    savedProduct,
                    currentWarehouseStock - previousWarehouseStock,
                    "WAREHOUSE",
                    note,
                    variant
            );
        }

        if (previousWarehouseStock <= 0 && currentWarehouseStock > 0) {
            restockNotificationService.notifySubscribersIfRestocked(savedProduct);
        }

        LinkedHashMap<String, Object> response = new LinkedHashMap<>();
        response.put("productId", savedProduct.getId());
        response.put("variantId", variant == null ? null : variant.getId());
        response.put("sellerStock", savedProduct.getSellerStock());
        response.put("warehouseStock", savedProduct.getWarehouseStock());
        response.put("lowStockThreshold", savedProduct.getLowStockThreshold());
        response.put("message", "Inventory updated successfully");
        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getProductMovements(Long productId) throws Exception {
        if (!productRepository.existsById(productId)) {
            throw new Exception("Product not found");
        }
        return inventoryService.getMovementsForProduct(productId);
    }

    @Override
    public Map<String, Object> triggerRestockNotification(Long productId, String note) throws Exception {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new Exception("Product not found"));
        return restockNotificationService.triggerManualNotification(product, note);
    }

    private void recordAdjustmentMovement(
            Product product,
            int delta,
            String stockBucket,
            String note,
            ProductVariant variant
    ) {
        if (delta == 0) {
            return;
        }

        boolean increase = delta > 0;
        InventoryMovement movement = new InventoryMovement();
        movement.setProduct(product);
        movement.setAction("ADMIN_STOCK_ADJUSTMENT");
        movement.setFromLocation(
                increase
                        ? "AUDIT_" + stockBucket
                        : stockBucket
        );
        movement.setToLocation(
                increase
                        ? stockBucket
                        : "AUDIT_" + stockBucket
        );
        movement.setQuantity(Math.abs(delta));
        movement.setMovementType("ADJUSTMENT");
        movement.setOrderStatus("STOCK_ADJUSTED");
        movement.setAddedBy("ADMIN");
        movement.setUpdatedBy("ADMIN");
        movement.setRequestType(variant == null ? "PRODUCT" : "VARIANT");
        movement.setNote(
                (variant == null
                        ? note
                        : note + " | variant " + describeVariant(variant))
        );
        movement.setCreatedAt(LocalDateTime.now());
        inventoryMovementRepository.save(movement);
    }

    private String describeVariant(ProductVariant variant) {
        if (variant.getSize() != null && !variant.getSize().isBlank()) {
            return variant.getSize();
        }
        if (variant.getVariantValue() != null && !variant.getVariantValue().isBlank()) {
            return variant.getVariantValue();
        }
        if (variant.getSku() != null && !variant.getSku().isBlank()) {
            return variant.getSku();
        }
        return String.valueOf(variant.getId());
    }

    private Long parseLong(Object value) {
        if (value == null || String.valueOf(value).isBlank()) {
            return null;
        }
        return value instanceof Number number ? number.longValue() : Long.parseLong(String.valueOf(value));
    }

    private Integer parseInteger(Object value) {
        if (value == null || String.valueOf(value).isBlank()) {
            return null;
        }
        return value instanceof Number number ? number.intValue() : Integer.parseInt(String.valueOf(value));
    }
}
