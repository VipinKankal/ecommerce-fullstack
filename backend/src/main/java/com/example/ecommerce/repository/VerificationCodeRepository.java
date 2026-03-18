package com.example.ecommerce.repository;

import com.example.ecommerce.modal.VerificationCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;


public interface VerificationCodeRepository extends JpaRepository<VerificationCode, Long> {
    VerificationCode findTopByEmailOrderByCreatedAtDesc(String email);
    VerificationCode findTopByOtpOrderByCreatedAtDesc(String otp);
    @Modifying
    @Transactional
    void deleteByEmail(String email);
}



