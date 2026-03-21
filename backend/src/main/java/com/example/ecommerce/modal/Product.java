package com.example.ecommerce.modal;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    private String title;
    private String brand;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String description;

    private int mrpPrice;
    private int sellingPrice;
    private int discountPercentage;
    private int quantity;
    private int sellerStock;
    private int warehouseStock;
    private String color;

    @ElementCollection
    private List<String> images = new ArrayList<>();

    private int numRatings;

    @ManyToOne
    private Category category;

    @ManyToOne
    private Seller seller;

    private LocalDateTime createdAt;

    private String size;

    @JsonIgnore
    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Review> reviews = new ArrayList<>();

    @PrePersist
    @PreUpdate
    private void syncStockFields() {
        if (sellerStock < 0) {
            sellerStock = 0;
        }
        if (warehouseStock < 0) {
            warehouseStock = 0;
        }
        quantity = warehouseStock;
    }
}
