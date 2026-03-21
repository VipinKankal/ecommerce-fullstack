package com.example.ecommerce.modal;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "inventory_movements")
public class InventoryMovement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    private Product product;

    private Long orderItemId;
    private Long requestId;
    private String requestType;
    private String action;
    private String fromLocation;
    private String toLocation;
    private Integer quantity;
    private String movementType;
    private String orderStatus;
    private String addedBy;
    private String updatedBy;

    @Column(length = 1200)
    private String note;

    private LocalDateTime createdAt = LocalDateTime.now();
}
