package com.example.ecommerce.modal;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class VerificationCode {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    private String otp;
    private String email;
    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime expiresAt;
    private Integer attempts = 0;
    private Boolean consumed = false;

    @OneToOne
    private User user;

    @OneToOne
    private Seller seller;
}



