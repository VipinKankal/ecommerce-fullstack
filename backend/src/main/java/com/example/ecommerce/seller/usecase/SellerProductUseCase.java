package com.example.ecommerce.seller.usecase;

import com.example.ecommerce.catalog.request.CreateProductRequest;
import com.example.ecommerce.catalog.request.UpdateProductRequest;
import com.example.ecommerce.catalog.service.ProductService;
import com.example.ecommerce.inventory.service.InventoryService;
import com.example.ecommerce.inventory.service.RestockNotificationService;
import com.example.ecommerce.inventory.service.WarehouseTransferService;
import com.example.ecommerce.modal.Product;
import com.example.ecommerce.modal.Seller;
import com.example.ecommerce.seller.service.SellerService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class SellerProductUseCase {

    private final ProductService productService;
    private final SellerService sellerService;
    private final InventoryService inventoryService;
    private final RestockNotificationService restockNotificationService;
    private final WarehouseTransferService warehouseTransferService;

    public List<Product> getProductsForSeller(String jwt) throws Exception {
        Seller seller = resolveSeller(jwt);
        return productService.getProductBySellerId(seller.getId());
    }

    public Product createProduct(CreateProductRequest request, String jwt) throws Exception {
        Seller seller = resolveSeller(jwt);
        return productService.createProduct(request, seller);
    }

    public void deleteProduct(Long productId, String jwt) throws Exception {
        Seller seller = resolveSeller(jwt);
        productService.deleteProduct(productId, seller.getId());
    }

    public Product updateProduct(Long productId, UpdateProductRequest request, String jwt) throws Exception {
        Seller seller = resolveSeller(jwt);
        return productService.updateProduct(productId, request, seller.getId());
    }

    public Product updateProductActiveState(Long productId, Map<String, Object> payload, String jwt) throws Exception {
        Seller seller = resolveSeller(jwt);
        return productService.setProductActive(productId, seller.getId(), parseActive(payload));
    }

    public Product transferStockToWarehouse(Long productId, Map<String, Object> payload, String jwt) throws Exception {
        Seller seller = resolveSeller(jwt);
        Product product = findSellerOwnedProduct(productId, seller);

        warehouseTransferService.createTransferRequest(
                product,
                seller,
                parseTransferQuantity(payload),
                resolveString(payload, "sellerNote", "Seller requested warehouse transfer"),
                resolveString(payload, "pickupMode", "WAREHOUSE_PICKUP")
        );

        return product;
    }

    public List<Map<String, Object>> getProductMovements(Long productId, String jwt) throws Exception {
        Seller seller = resolveSeller(jwt);
        findSellerOwnedProduct(productId, seller);
        return inventoryService.getMovementsForProduct(productId);
    }

    public Map<String, Object> getSellerDemandInsights(String jwt) throws Exception {
        Seller seller = resolveSeller(jwt);
        return restockNotificationService.getSellerDemandInsights(seller.getId());
    }

    private Seller resolveSeller(String jwt) throws Exception {
        return sellerService.getSellerProfile(jwt);
    }

    private Product findSellerOwnedProduct(Long productId, Seller seller) throws Exception {
        Product product = productService.findProductById(productId);
        if (product.getSeller() == null || !seller.getId().equals(product.getSeller().getId())) {
            throw new Exception("Unauthorized product access");
        }
        return product;
    }

    private boolean parseActive(Map<String, Object> payload) {
        Object rawActive = payload == null ? null : payload.get("active");
        return rawActive instanceof Boolean active
                ? active
                : Boolean.parseBoolean(String.valueOf(rawActive));
    }

    private int parseTransferQuantity(Map<String, Object> payload) {
        Object rawQuantity = payload == null ? null : payload.get("quantity");
        if (rawQuantity == null) {
            throw new IllegalArgumentException("Transfer quantity is required");
        }
        try {
            return rawQuantity instanceof Number quantity
                    ? quantity.intValue()
                    : Integer.parseInt(String.valueOf(rawQuantity));
        } catch (NumberFormatException ex) {
            throw new IllegalArgumentException("Invalid transfer quantity");
        }
    }

    private String resolveString(Map<String, Object> payload, String key, String fallback) {
        if (payload == null || payload.get(key) == null) {
            return fallback;
        }
        return String.valueOf(payload.get(key));
    }
}

