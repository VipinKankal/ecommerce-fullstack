package com.example.ecommerce.catalog.service.impl;

import com.example.ecommerce.modal.Category;
import com.example.ecommerce.modal.Product;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

final class ProductCatalogQuerySupport {

    private ProductCatalogQuerySupport() {
    }

    static Specification<Product> buildProductSpecification(
            String category,
            String brand,
            String colors,
            String size,
            Integer minPrice,
            Integer maxPrice,
            Integer minDiscount,
            String stock
    ) {
        return (root, query, cb) -> {
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
    }

    static Pageable buildPageable(String sort, Integer pageNumber) {
        int page = pageNumber != null ? pageNumber : 0;
        if (sort != null && !sort.isEmpty()) {
            return switch (sort) {
                case "price_low" -> PageRequest.of(page, 10, Sort.by("sellingPrice").ascending());
                case "price_high" -> PageRequest.of(page, 10, Sort.by("sellingPrice").descending());
                default -> PageRequest.of(page, 10);
            };
        }
        return PageRequest.of(page, 10);
    }
}
