package com.example.ecommerce.catalog.service.impl;

import com.example.ecommerce.catalog.request.CreateProductRequest;
import com.example.ecommerce.catalog.request.UpdateProductRequest;
import com.example.ecommerce.catalog.service.ProductService;
import com.example.ecommerce.common.domain.OrderStatus;
import com.example.ecommerce.common.exceptions.ProductException;
import com.example.ecommerce.inventory.service.InventoryService;
import com.example.ecommerce.modal.Category;
import com.example.ecommerce.modal.Product;
import com.example.ecommerce.modal.ProductVariant;
import com.example.ecommerce.modal.Seller;
import com.example.ecommerce.repository.CategoryRepository;
import com.example.ecommerce.repository.OrderItemRepository;
import com.example.ecommerce.repository.ProductRepository;
import com.example.ecommerce.tax.request.ProductTaxPreviewRequest;
import com.example.ecommerce.tax.response.SellerProductTaxPreviewResponse;
import com.example.ecommerce.tax.service.ProductTaxReviewService;
import com.example.ecommerce.tax.service.SellerProductTaxPreviewService;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
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

        int discountPercentage = calculateDiscountPercentage(
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
        product.setCostPrice(normalizeCurrencyValue(request.getCostPrice(), 0.0));
        product.setPlatformCommission(normalizeCurrencyValue(request.getPlatformCommission(), 0.0));
        product.setCurrencyCode(normalizeCurrency(request.getCurrency()));
        product.setLowStockThreshold(10);
        product.setWarrantyType(normalizeWarrantyType(request.getWarrantyType()));
        product.setWarrantyDays(normalizeWarrantyDays(request.getWarrantyType(), request.getWarrantyDays()));
        product.setVariants(buildVariants(request.getVariants(), product));
        product.setDiscountPercentage(discountPercentage);

        ProductTaxPreviewRequest previewRequest = buildTaxPreviewRequest(request);
        SellerProductTaxPreviewResponse taxPreview = sellerProductTaxPreviewService.preview(seller, previewRequest);
        applyResolvedTaxPreview(product, request, taxPreview);

        Product savedProduct = inventoryService.initializeSellerOwnedStock(
                product,
                request.getQuantity(),
                "Seller added product to catalog"
        );
        syncTaxReview(savedProduct, previewRequest, taxPreview);
        initializeCollections(savedProduct);
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
            throw new ProductException("Product cannot be deleted while active orders exist");
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
            existing.setPricingMode(normalizePricingMode(request.getPricingMode()));
        }
        if (request.getCostPrice() != null) {
            existing.setCostPrice(normalizeCurrencyValue(request.getCostPrice(), 0.0));
        }
        if (request.getPlatformCommission() != null) {
            existing.setPlatformCommission(normalizeCurrencyValue(request.getPlatformCommission(), 0.0));
        }
        if (request.getCurrency() != null) {
            existing.setCurrencyCode(normalizeCurrency(request.getCurrency()));
        }
        if (request.getWarrantyType() != null) {
            existing.setWarrantyType(normalizeWarrantyType(request.getWarrantyType()));
        }
        if (request.getWarrantyDays() != null || request.getWarrantyType() != null) {
            existing.setWarrantyDays(
                    normalizeWarrantyDays(
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

        ProductTaxPreviewRequest previewRequest = buildTaxPreviewRequest(request, existing);
        SellerProductTaxPreviewResponse taxPreview = sellerProductTaxPreviewService.preview(existing.getSeller(), previewRequest);
        applyResolvedTaxPreview(existing, request, taxPreview);

        boolean sellerStockUpdated = request.getQuantity() != null;
        Integer nextSellerStock = request.getQuantity();
        existing.setDiscountPercentage(
                calculateDiscountPercentage(existing.getMrpPrice(), existing.getSellingPrice())
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
        initializeCollections(savedProduct);
        return savedProduct;
    }

    @Override
    @Transactional
    public Product setProductActive(Long productId, Long sellerId, boolean active) throws ProductException {
        Product product = findProductById(productId);
        validateSellerAccess(product, sellerId);
        product.setActive(active);
        Product savedProduct = productRepository.save(product);
        initializeCollections(savedProduct);
        return savedProduct;
    }

    @Override
    @Transactional(readOnly = true)
    public Product findProductById(Long productId) throws ProductException {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ProductException("Product not found with id " + productId));
        initializeCollections(product);
        return product;
    }

    @Override
    @Transactional(readOnly = true)
    public Product findActiveProductById(Long productId) throws ProductException {
        Product product = findProductById(productId);
        if (!product.isActive()) {
            throw new ProductException("Product not found with id " + productId);
        }
        return product;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Product> searchProduct(String query) {
        List<Product> products = productRepository.searchProduct(query);
        products.forEach(this::initializeCollections);
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
        Specification<Product> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (category != null) {
                Join<Product, Category> categoryJoin = root.join("category");
                predicates.add(cb.equal(categoryJoin.get("categoryId"), category));
            }

            if (brand != null && !brand.isBlank()) {
                predicates.add(cb.equal(cb.lower(root.get("brand")), brand.trim().toLowerCase()));
            }

            if (colors != null) {
                predicates.add(cb.equal(root.get("color"), colors));
            }

            if (size != null) {
                predicates.add(cb.equal(root.get("size"), size));
            }

            if (minPrice != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("sellingPrice"), minPrice));
            }

            if (maxPrice != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("sellingPrice"), maxPrice));
            }

            if (minDiscount != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("discountPercentage"), minDiscount));
            }

            if (stock != null) {
                if (stock.equalsIgnoreCase("in_stock")) {
                    predicates.add(cb.greaterThan(root.get("quantity"), 0));
                } else if (stock.equalsIgnoreCase("out_of_stock")) {
                    predicates.add(cb.equal(root.get("quantity"), 0));
                }
            }

            predicates.add(cb.isTrue(root.get("active")));
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        int page = pageNumber != null ? pageNumber : 0;
        Pageable pageable;
        if (sort != null && !sort.isEmpty()) {
            pageable = switch (sort) {
                case "price_low" -> PageRequest.of(page, 10, Sort.by("sellingPrice").ascending());
                case "price_high" -> PageRequest.of(page, 10, Sort.by("sellingPrice").descending());
                default -> PageRequest.of(page, 10);
            };
        } else {
            pageable = PageRequest.of(page, 10);
        }

        Page<Product> products = productRepository.findAll(spec, pageable);
        products.getContent().forEach(this::initializeCollections);
        return products;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Product> getProductBySellerId(Long sellerId) {
        List<Product> products = productRepository.findBySellerId(sellerId);
        products.forEach(this::initializeCollections);
        return products;
    }

    private void validateSellerAccess(Product product, Long sellerId) throws ProductException {
        if (product.getSeller() == null
                || product.getSeller().getId() == null
                || !product.getSeller().getId().equals(sellerId)) {
            throw new ProductException("Unauthorized product access");
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

    private int calculateDiscountPercentage(int mrpPrice, int sellingPrice) {
        if (mrpPrice <= 0) {
            throw new IllegalArgumentException("MRP price must be greater than zero");
        }
        double discount = mrpPrice - sellingPrice;
        double discountPercentage = (discount / mrpPrice) * 100;
        return (int) discountPercentage;
    }

    private void applyResolvedTaxPreview(
            Product product,
            CreateProductRequest request,
            SellerProductTaxPreviewResponse taxPreview
    ) {
        product.setUiCategoryKey(resolveUiCategoryKey(
                request.getUiCategoryKey(),
                request.getCategory3(),
                request.getCategory2(),
                request.getCategory()
        ));
        product.setSubcategoryKey(resolveUiCategoryKey(
                request.getSubcategoryKey(),
                request.getCategory2(),
                request.getCategory(),
                null
        ));
        product.setGender(normalizeNullable(request.getGender()));
        product.setFabricType(normalizeNullable(request.getFabricType()));
        product.setConstructionType(normalizeNullable(request.getConstructionType()));
        product.setFiberFamily(normalizeNullable(request.getFiberFamily()));
        product.setHsnSelectionMode(normalizeNullable(taxPreview.getHsnSelectionMode()));
        product.setSuggestedHsnCode(normalizeNullable(taxPreview.getSuggestedHsnCode()));
        product.setOverrideRequestedHsnCode(
                normalizeNullable(resolveOverrideHsn(request.getOverrideRequestedHsnCode(), request.getHsnCode()))
        );
        product.setHsnOverrideReason(trimToNull(request.getHsnOverrideReason()));
        product.setHsnCode(normalizeNullable(taxPreview.getResolvedHsnCode()));
        product.setTaxReviewStatus(resolveTaxReviewStatus(taxPreview));
        product.setPricingMode(normalizePricingMode(request.getPricingMode()));
        product.setTaxClass(normalizeTaxClass(taxPreview.getTaxClass()));
        product.setTaxRuleVersion(normalizeTaxRuleVersion(
                taxPreview.getGstRuleCode() == null ? request.getTaxRuleVersion() : taxPreview.getGstRuleCode()
        ));
        product.setTaxPercentage(normalizeCurrencyValue(taxPreview.getGstRatePreview(), 0.0));
        product.setActive(shouldBeActive(taxPreview));
    }

    private void applyResolvedTaxPreview(
            Product product,
            UpdateProductRequest request,
            SellerProductTaxPreviewResponse taxPreview
    ) {
        product.setUiCategoryKey(normalizeCategoryKey(firstNonBlank(request.getUiCategoryKey(), product.getUiCategoryKey())));
        product.setSubcategoryKey(normalizeCategoryKey(firstNonBlank(request.getSubcategoryKey(), product.getSubcategoryKey())));
        product.setGender(request.getGender() == null ? product.getGender() : normalizeNullable(request.getGender()));
        product.setFabricType(request.getFabricType() == null ? product.getFabricType() : normalizeNullable(request.getFabricType()));
        product.setConstructionType(
                request.getConstructionType() == null ? product.getConstructionType() : normalizeNullable(request.getConstructionType())
        );
        product.setFiberFamily(request.getFiberFamily() == null ? product.getFiberFamily() : normalizeNullable(request.getFiberFamily()));
        product.setHsnSelectionMode(normalizeNullable(taxPreview.getHsnSelectionMode()));
        product.setSuggestedHsnCode(normalizeNullable(taxPreview.getSuggestedHsnCode()));
        product.setOverrideRequestedHsnCode(
                normalizeNullable(resolveOverrideHsn(request.getOverrideRequestedHsnCode(), request.getHsnCode()))
        );
        if (request.getHsnOverrideReason() != null) {
            product.setHsnOverrideReason(trimToNull(request.getHsnOverrideReason()));
        }
        product.setHsnCode(normalizeNullable(taxPreview.getResolvedHsnCode()));
        product.setTaxReviewStatus(resolveTaxReviewStatus(taxPreview));
        product.setTaxClass(normalizeTaxClass(taxPreview.getTaxClass()));
        product.setTaxRuleVersion(normalizeTaxRuleVersion(
                taxPreview.getGstRuleCode() == null
                        ? firstNonBlank(request.getTaxRuleVersion(), product.getTaxRuleVersion())
                        : taxPreview.getGstRuleCode()
        ));
        product.setTaxPercentage(normalizeCurrencyValue(taxPreview.getGstRatePreview(), 0.0));
        product.setActive(shouldBeActive(taxPreview));
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

    private ProductTaxPreviewRequest buildTaxPreviewRequest(CreateProductRequest request) {
        ProductTaxPreviewRequest previewRequest = new ProductTaxPreviewRequest();
        previewRequest.setUiCategoryKey(resolveUiCategoryKey(
                request.getUiCategoryKey(),
                request.getCategory3(),
                request.getCategory2(),
                request.getCategory()
        ));
        previewRequest.setSubcategoryKey(resolveUiCategoryKey(
                request.getSubcategoryKey(),
                request.getCategory2(),
                request.getCategory(),
                null
        ));
        previewRequest.setGender(request.getGender());
        previewRequest.setFabricType(request.getFabricType());
        previewRequest.setConstructionType(request.getConstructionType());
        previewRequest.setFiberFamily(request.getFiberFamily());
        previewRequest.setHsnSelectionMode(request.getHsnSelectionMode());
        previewRequest.setOverrideRequestedHsnCode(resolveOverrideHsn(request.getOverrideRequestedHsnCode(), request.getHsnCode()));
        previewRequest.setHsnOverrideReason(request.getHsnOverrideReason());
        previewRequest.setPricingMode(request.getPricingMode());
        previewRequest.setTaxClass(request.getTaxClass());
        previewRequest.setTaxRuleVersion(request.getTaxRuleVersion());
        previewRequest.setSellingPricePerPiece((double) request.getSellingPrice());
        previewRequest.setCostPrice(request.getCostPrice());
        previewRequest.setPlatformCommission(request.getPlatformCommission());
        return previewRequest;
    }

    private ProductTaxPreviewRequest buildTaxPreviewRequest(UpdateProductRequest request, Product product) {
        ProductTaxPreviewRequest previewRequest = new ProductTaxPreviewRequest();
        previewRequest.setUiCategoryKey(firstNonBlank(request.getUiCategoryKey(), product.getUiCategoryKey()));
        previewRequest.setSubcategoryKey(firstNonBlank(request.getSubcategoryKey(), product.getSubcategoryKey()));
        previewRequest.setGender(firstNonBlank(request.getGender(), product.getGender()));
        previewRequest.setFabricType(firstNonBlank(request.getFabricType(), product.getFabricType()));
        previewRequest.setConstructionType(firstNonBlank(request.getConstructionType(), product.getConstructionType()));
        previewRequest.setFiberFamily(firstNonBlank(request.getFiberFamily(), product.getFiberFamily()));
        previewRequest.setHsnSelectionMode(firstNonBlank(request.getHsnSelectionMode(), product.getHsnSelectionMode()));
        previewRequest.setOverrideRequestedHsnCode(resolveOverrideHsn(request.getOverrideRequestedHsnCode(), request.getHsnCode()));
        previewRequest.setHsnOverrideReason(
                request.getHsnOverrideReason() == null ? product.getHsnOverrideReason() : request.getHsnOverrideReason()
        );
        previewRequest.setPricingMode(firstNonBlank(request.getPricingMode(), product.getPricingMode()));
        previewRequest.setTaxClass(firstNonBlank(request.getTaxClass(), product.getTaxClass()));
        previewRequest.setTaxRuleVersion(firstNonBlank(request.getTaxRuleVersion(), product.getTaxRuleVersion()));
        previewRequest.setSellingPricePerPiece(
                (double) (request.getSellingPrice() == null ? product.getSellingPrice() : request.getSellingPrice())
        );
        previewRequest.setCostPrice(request.getCostPrice() == null ? product.getCostPrice() : request.getCostPrice());
        previewRequest.setPlatformCommission(
                request.getPlatformCommission() == null ? product.getPlatformCommission() : request.getPlatformCommission()
        );
        return previewRequest;
    }

    private String resolveTaxReviewStatus(SellerProductTaxPreviewResponse taxPreview) {
        if (!Boolean.TRUE.equals(taxPreview.getSellerTaxEligible())) {
            return "SELLER_INELIGIBLE";
        }
        if (Boolean.TRUE.equals(taxPreview.getRequiresFiberSelection())) {
            return "FIBER_SELECTION_REQUIRED";
        }
        return taxPreview.getReviewStatus() == null ? "NOT_REQUIRED" : taxPreview.getReviewStatus();
    }

    private boolean shouldBeActive(SellerProductTaxPreviewResponse taxPreview) {
        return Boolean.TRUE.equals(taxPreview.getSellerTaxEligible())
                && !Boolean.TRUE.equals(taxPreview.getRequiresFiberSelection())
                && !Boolean.TRUE.equals(taxPreview.getRequiresReview());
    }

    private String resolveUiCategoryKey(String first, String second, String third, String fourth) {
        return normalizeCategoryKey(firstNonBlank(first, second, third, fourth));
    }

    private String resolveOverrideHsn(String requestedOverrideHsnCode, String fallbackHsnCode) {
        return normalizeNullable(firstNonBlank(requestedOverrideHsnCode, fallbackHsnCode));
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return null;
    }

    private String normalizeWarrantyType(String value) {
        if (value == null || value.isBlank()) {
            return "NONE";
        }
        String normalized = value.trim().toUpperCase();
        if ("MANUFACTURER".equals(normalized)) {
            return "BRAND";
        }
        if (!List.of("NONE", "BRAND", "SELLER").contains(normalized)) {
            return "NONE";
        }
        return normalized;
    }

    private Integer normalizeWarrantyDays(String warrantyType, Integer warrantyDays) {
        if ("NONE".equalsIgnoreCase(normalizeWarrantyType(warrantyType))) {
            return 0;
        }
        if (warrantyDays == null) {
            return 0;
        }
        return Math.max(warrantyDays, 0);
    }

    private String normalizePricingMode(String pricingMode) {
        if (pricingMode == null || pricingMode.isBlank()) {
            return "INCLUSIVE";
        }
        String normalized = pricingMode.trim().toUpperCase();
        return List.of("INCLUSIVE", "EXCLUSIVE").contains(normalized) ? normalized : "INCLUSIVE";
    }

    private String normalizeTaxClass(String taxClass) {
        if (taxClass == null || taxClass.isBlank()) {
            return "APPAREL_STANDARD";
        }
        return taxClass.trim().toUpperCase();
    }

    private String normalizeTaxRuleVersion(String taxRuleVersion) {
        if (taxRuleVersion == null || taxRuleVersion.isBlank()) {
            return "AUTO_ACTIVE";
        }
        return taxRuleVersion.trim().toUpperCase();
    }

    private String normalizeCurrency(String currency) {
        if (currency == null || currency.isBlank()) {
            return "INR";
        }
        return currency.trim().toUpperCase();
    }

    private Double normalizeCurrencyValue(Number value, double fallback) {
        if (value == null) {
            return fallback;
        }
        return Math.max(value.doubleValue(), 0.0);
    }

    private String normalizeNullable(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isBlank() ? null : trimmed.toUpperCase();
    }

    private String normalizeCategoryKey(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim().toLowerCase();
        return trimmed.isBlank() ? null : trimmed;
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isBlank() ? null : trimmed;
    }

    private List<ProductVariant> buildVariants(
            List<CreateProductRequest.VariantRequest> variants,
            Product product
    ) {
        if (variants == null || variants.isEmpty()) {
            return new ArrayList<>();
        }

        return variants.stream()
                .filter(variant -> variant != null)
                .map(variant -> {
                    ProductVariant productVariant = new ProductVariant();
                    productVariant.setProduct(product);
                    productVariant.setVariantType(variant.getVariantType());
                    productVariant.setVariantValue(variant.getVariantValue());
                    productVariant.setSize(variant.getSize() == null ? null : variant.getSize().trim());
                    productVariant.setColor(variant.getColor() == null ? null : variant.getColor().trim());
                    productVariant.setSku(variant.getSku() == null ? null : variant.getSku().trim());
                    productVariant.setPrice(variant.getPrice());
                    int initialSellerStock = Math.max(variant.getQuantity() == null ? 0 : variant.getQuantity(), 0);
                    productVariant.setSellerStock(initialSellerStock);
                    productVariant.setWarehouseStock(0);
                    return productVariant;
                })
                .toList();
    }

    private void initializeCollections(Product product) {
        if (product != null && product.getImages() != null) {
            product.getImages().size();
        }
        if (product != null && product.getVariants() != null) {
            product.getVariants().size();
        }
    }
}
