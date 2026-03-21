package com.example.ecommerce.catalog.service.impl;

import com.example.ecommerce.common.domain.OrderStatus;
import com.example.ecommerce.common.exceptions.ProductException;
import com.example.ecommerce.inventory.service.InventoryService;
import com.example.ecommerce.modal.Category;
import com.example.ecommerce.modal.Product;
import com.example.ecommerce.modal.ProductVariant;
import com.example.ecommerce.modal.Seller;
import com.example.ecommerce.repository.CategoryRepository;
import com.example.ecommerce.repository.ProductRepository;
import com.example.ecommerce.catalog.request.CreateProductRequest;
import com.example.ecommerce.catalog.request.UpdateProductRequest;
import com.example.ecommerce.catalog.service.ProductService;
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
public class ProductServiceImpl implements ProductService{

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final InventoryService inventoryService;
    private final com.example.ecommerce.repository.OrderItemRepository orderItemRepository;

    @Override
    @Transactional
    public Product createProduct(CreateProductRequest request, Seller seller) {
        Category category1 = categoryRepository.findByCategoryId(request.getCategory());
        if (category1== null){
            Category category = new Category();
            category.setCategoryId(request.getCategory());
            category.setLevel(1);
            category1=categoryRepository.save(category);
        }

        Category category2 = categoryRepository.findByCategoryId(request.getCategory2());
        if (category2== null){
            Category category = new Category();
            category.setCategoryId(request.getCategory2());
            category.setLevel(2);
            category.setParentCategory(category1);
            category2=categoryRepository.save(category);
        }

        Category category3 = categoryRepository.findByCategoryId(request.getCategory3());
        if (category3== null){
            Category category = new Category();
            category.setCategoryId(request.getCategory3());
            category.setLevel(3);
            category.setParentCategory(category2);
            category3=categoryRepository.save(category);
        }

        int discountPercentage =  calculateDiscountPercentage(request.getMrpPrice(), request.getSellingPrice());

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
        product.setActive(true);
        product.setWarrantyType(normalizeWarrantyType(request.getWarrantyType()));
        product.setWarrantyDays(normalizeWarrantyDays(request.getWarrantyType(), request.getWarrantyDays()));
        product.setVariants(buildVariants(request.getVariants(), product));
        product.setDiscountPercentage(discountPercentage);
        Product savedProduct = inventoryService.initializeSellerOwnedStock(
                product,
                request.getQuantity(),
                "Seller added product to catalog"
        );
        initializeCollections(savedProduct);
        return savedProduct;
    }

    private void validateSellerAccess(Product product, Long sellerId) throws ProductException {
        if (product.getSeller() == null || product.getSeller().getId() == null || !product.getSeller().getId().equals(sellerId)) {
            throw new ProductException("Unauthorized product access");
        }
    }

    private int calculateDiscountPercentage(int mrpPrice, int sellingPrice) {
        if (mrpPrice<=0){
            throw new IllegalArgumentException("MRP price must be greater than zero");
        }
        double discount = mrpPrice-sellingPrice;
        double discountPercentage = (discount / mrpPrice) * 100;
        return (int)discountPercentage;
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
        if (request.getActive() != null) {
            existing.setActive(request.getActive());
        }
        if (request.getMrpPrice() != null) {
            existing.setMrpPrice(request.getMrpPrice());
        }
        if (request.getSellingPrice() != null) {
            existing.setSellingPrice(request.getSellingPrice());
        }
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
                    productVariant.setSellerStock(0);
                    productVariant.setWarehouseStock(Math.max(variant.getQuantity() == null ? 0 : variant.getQuantity(), 0));
                    return productVariant;
                })
                .toList();
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
                predicates.add(cb.greaterThanOrEqualTo(
                        root.get("discountPercentage"), minDiscount
                ));
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

        Pageable pageable;
        int page = pageNumber != null ? pageNumber : 0;

        if (sort != null && !sort.isEmpty()) {
            pageable = switch (sort) {
                case "price_low" ->
                        PageRequest.of(page, 10, Sort.by("sellingPrice").ascending());
                case "price_high" ->
                        PageRequest.of(page, 10, Sort.by("sellingPrice").descending());
                default ->
                        PageRequest.of(page, 10);
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

    private void initializeCollections(Product product) {
        if (product != null && product.getImages() != null) {
            product.getImages().size();
        }
        if (product != null && product.getVariants() != null) {
            product.getVariants().size();
        }
    }
}







