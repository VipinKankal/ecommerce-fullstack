package com.example.ecommerce.catalog.service.impl;

import com.example.ecommerce.catalog.request.CreateProductRequest;
import com.example.ecommerce.catalog.request.UpdateProductRequest;
import com.example.ecommerce.catalog.service.ProductService;
import com.example.ecommerce.common.domain.OrderStatus;
import com.example.ecommerce.common.exceptions.ProductException;
import com.example.ecommerce.inventory.service.InventoryService;
import com.example.ecommerce.modal.Category;
import com.example.ecommerce.modal.Product;
import com.example.ecommerce.modal.Seller;
import com.example.ecommerce.repository.CategoryRepository;
import com.example.ecommerce.repository.OrderItemRepository;
import com.example.ecommerce.repository.ProductRepository;
import com.example.ecommerce.tax.request.ProductTaxPreviewRequest;
import com.example.ecommerce.tax.response.SellerProductTaxPreviewResponse;
import com.example.ecommerce.tax.service.ProductTaxReviewService;
import com.example.ecommerce.tax.service.SellerProductTaxPreviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.EnumSet;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final InventoryService inventoryService;
    private final OrderItemRepository orderItemRepository;
    private final SellerProductTaxPreviewService sellerProductTaxPreviewService;
    private final ProductTaxReviewService productTaxReviewService;

    @Override
    @Transactional
    public Product createProduct(CreateProductRequest request, Seller seller) {
        Category category1 = ensureCategory(request.getCategory(), 1, null);
        Category category2 = ensureCategory(request.getCategory2(), 2, category1);
        Category category3 = ensureCategory(request.getCategory3(), 3, category2);

        int discountPercentage = ProductValueSupport.calculateDiscountPercentage(
                request.getMrpPrice(),
                request.getSellingPrice()
        );

        Product product = new Product();
        product.setSeller(seller);
        product.setCategory(category3);
        product.setDescription(request.getDescription());
        product.setBrand(request.getBrand() == null ? null : request.getBrand().trim());
        product.setCreatedAt(LocalDateTime.now());
        product.setTitle(request.getTitle());
        product.setColor(request.getColor());
        product.setSellingPrice(request.getSellingPrice());
        product.setImages(request.getImages());
        product.setMrpPrice(request.getMrpPrice());
        product.setSize(request.getSize());
        product.setCostPrice(ProductValueSupport.normalizeCurrencyValue(request.getCostPrice(), 0.0));
        product.setPlatformCommission(ProductValueSupport.normalizeCurrencyValue(request.getPlatformCommission(), 0.0));
        product.setCurrencyCode(ProductValueSupport.normalizeCurrency(request.getCurrency()));
        product.setLowStockThreshold(10);
        product.setWarrantyType(ProductValueSupport.normalizeWarrantyType(request.getWarrantyType()));
        product.setWarrantyDays(ProductValueSupport.normalizeWarrantyDays(request.getWarrantyType(), request.getWarrantyDays()));
        product.setVariants(ProductValueSupport.buildVariants(request.getVariants(), product));
        product.setDiscountPercentage(discountPercentage);

        ProductTaxPreviewRequest previewRequest = ProductTaxSupport.buildTaxPreviewRequest(request);
        SellerProductTaxPreviewResponse taxPreview = sellerProductTaxPreviewService.preview(seller, previewRequest);
        ProductTaxSupport.applyResolvedTaxPreview(product, request, taxPreview);

        Product savedProduct = inventoryService.initializeSellerOwnedStock(
                product,
                request.getQuantity(),
                "Seller added product to catalog"
        );
        if (Boolean.TRUE.equals(taxPreview.getRequiresReview())) {
            syncTaxReview(savedProduct, previewRequest, taxPreview);
        }
        ProductValueSupport.initializeCollections(savedProduct);
        return savedProduct;
    }

    @Override
    @Transactional
    public void deleteProduct(Long productId, Long sellerId) throws ProductException {
        Product product = findProductById(productId);
        validateSellerAccess(product, sellerId);
        boolean hasActiveOrders = orderItemRepository.existsByProductIdAndOrderOrderStatusNotIn(
                productId,
                EnumSet.of(OrderStatus.CANCELLED, OrderStatus.DELIVERED)
        );
        if (hasActiveOrders) {
            throw ProductException.activeOrderConflict(productId);
        }
        productRepository.delete(product);
    }

    @Override
    @Transactional
    public Product updateProduct(Long productId, UpdateProductRequest request, Long sellerId) throws ProductException {
        Product existing = findProductById(productId);
        validateSellerAccess(existing, sellerId);

        if (request.getTitle() != null) {
            existing.setTitle(request.getTitle());
        }
        if (request.getDescription() != null) {
            existing.setDescription(request.getDescription());
        }
        if (request.getBrand() != null) {
            existing.setBrand(request.getBrand().trim());
        }
        if (request.getColor() != null) {
            existing.setColor(request.getColor());
        }
        if (request.getImages() != null) {
            existing.setImages(request.getImages());
        }
        if (request.getSize() != null) {
            existing.setSize(request.getSize());
        }
        if (request.getPricingMode() != null) {
            existing.setPricingMode(ProductValueSupport.normalizePricingMode(request.getPricingMode()));
        }
        if (request.getCostPrice() != null) {
            existing.setCostPrice(ProductValueSupport.normalizeCurrencyValue(request.getCostPrice(), 0.0));
        }
        if (request.getPlatformCommission() != null) {
            existing.setPlatformCommission(ProductValueSupport.normalizeCurrencyValue(request.getPlatformCommission(), 0.0));
        }
        if (request.getCurrency() != null) {
            existing.setCurrencyCode(ProductValueSupport.normalizeCurrency(request.getCurrency()));
        }
        if (request.getWarrantyType() != null) {
            existing.setWarrantyType(ProductValueSupport.normalizeWarrantyType(request.getWarrantyType()));
        }
        if (request.getWarrantyDays() != null || request.getWarrantyType() != null) {
            existing.setWarrantyDays(
                    ProductValueSupport.normalizeWarrantyDays(
                            existing.getWarrantyType(),
                            request.getWarrantyDays() != null ? request.getWarrantyDays() : existing.getWarrantyDays()
                    )
            );
        }
        if (request.getLowStockThreshold() != null) {
            existing.setLowStockThreshold(Math.max(request.getLowStockThreshold(), 0));
        }
        if (request.getMrpPrice() != null) {
            existing.setMrpPrice(request.getMrpPrice());
        }
        if (request.getSellingPrice() != null) {
            existing.setSellingPrice(request.getSellingPrice());
        }

        ProductTaxPreviewRequest previewRequest = ProductTaxSupport.buildTaxPreviewRequest(request, existing);
        SellerProductTaxPreviewResponse taxPreview = sellerProductTaxPreviewService.preview(existing.getSeller(), previewRequest);
        ProductTaxSupport.applyResolvedTaxPreview(existing, request, taxPreview);

        boolean sellerStockUpdated = request.getQuantity() != null;
        Integer nextSellerStock = request.getQuantity();
        existing.setDiscountPercentage(
                ProductValueSupport.calculateDiscountPercentage(existing.getMrpPrice(), existing.getSellingPrice())
        );

        Product savedProduct;
        if (sellerStockUpdated) {
            savedProduct = inventoryService.updateSellerStock(
                    existing,
                    nextSellerStock,
                    "Seller updated available seller-side stock"
            );
        } else {
            savedProduct = productRepository.save(existing);
        }

        syncTaxReview(savedProduct, previewRequest, taxPreview);
        ProductValueSupport.initializeCollections(savedProduct);
        return savedProduct;
    }

    @Override
    @Transactional
    public Product setProductActive(Long productId, Long sellerId, boolean active) throws ProductException {
        Product product = findProductById(productId);
        validateSellerAccess(product, sellerId);
        product.setActive(active);
        Product savedProduct = productRepository.save(product);
        ProductValueSupport.initializeCollections(savedProduct);
        return savedProduct;
    }

    @Override
    @Transactional(readOnly = true)
    public Product findProductById(Long productId) throws ProductException {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> ProductException.notFound(productId));
        ProductValueSupport.initializeCollections(product);
        return product;
    }

    @Override
    @Transactional(readOnly = true)
    public Product findActiveProductById(Long productId) throws ProductException {
        Product product = findProductById(productId);
        if (!product.isActive()) {
            throw ProductException.notFound(productId);
        }
        return product;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Product> searchProduct(String query) {
        List<Product> products = productRepository.searchProduct(query);
        products.forEach(ProductValueSupport::initializeCollections);
        return products.stream().filter(Product::isActive).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Product> getAllProducts(
            String category,
            String brand,
            String colors,
            String size,
            Integer minPrice,
            Integer maxPrice,
            Integer minDiscount,
            String sort,
            String stock,
            Integer pageNumber
    ) {
        Page<Product> products = productRepository.findAll(
                ProductCatalogQuerySupport.buildProductSpecification(
                        category,
                        brand,
                        colors,
                        size,
                        minPrice,
                        maxPrice,
                        minDiscount,
                        stock
                ),
                ProductCatalogQuerySupport.buildPageable(sort, pageNumber)
        );
        products.getContent().forEach(ProductValueSupport::initializeCollections);
        return products;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Product> getProductBySellerId(Long sellerId) {
        List<Product> products = productRepository.findBySellerId(sellerId);
        products.forEach(ProductValueSupport::initializeCollections);
        return products;
    }

    private void validateSellerAccess(Product product, Long sellerId) throws ProductException {
        if (product.getSeller() == null
                || product.getSeller().getId() == null
                || !product.getSeller().getId().equals(sellerId)) {
            throw ProductException.unauthorizedAccess(product.getId(), sellerId);
        }
    }

    private Category ensureCategory(String categoryId, int level, Category parentCategory) {
        Category existing = categoryRepository.findByCategoryId(categoryId);
        if (existing != null) {
            return existing;
        }
        Category category = new Category();
        category.setCategoryId(categoryId);
        category.setLevel(level);
        category.setParentCategory(parentCategory);
        return categoryRepository.save(category);
    }

    private void syncTaxReview(
            Product product,
            ProductTaxPreviewRequest previewRequest,
            SellerProductTaxPreviewResponse taxPreview
    ) {
        if (Boolean.TRUE.equals(taxPreview.getRequiresReview())) {
            productTaxReviewService.upsertPendingReview(
                    product,
                    taxPreview.getSuggestedHsnCode(),
                    previewRequest.getOverrideRequestedHsnCode(),
                    previewRequest.getHsnOverrideReason()
            );
            return;
        }
        productTaxReviewService.clearReviewForProduct(product.getId());
    }

}
