package com.example.ecommerce.modal;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RequestHistoryEntry {
    private String status;

    @Column(length = 1200)
    private String note;

    private String updatedBy;

    private LocalDateTime createdAt = LocalDateTime.now();
}
