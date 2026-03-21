package com.example.ecommerce.modal;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class CartItem {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    @ManyToOne
    @JsonIgnore
    private Cart cart;

    @ManyToOne
    @JsonIgnoreProperties({"category", "seller", "reviews", "variants", "hibernateLazyInitializer", "handler"})
    private Product product;
    private String size;
    private int quantity = 1;

    @Column(nullable = false)
    private Integer mrpPrice = 0;

    @Column(nullable = false)
    private Integer sellingPrice = 0;

    private Long userId;


}



