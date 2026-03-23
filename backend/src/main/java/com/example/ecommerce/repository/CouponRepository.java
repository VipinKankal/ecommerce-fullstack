package com.example.ecommerce.repository;

import com.example.ecommerce.modal.Coupon;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface CouponRepository extends JpaRepository<Coupon,Long> {
    Coupon findByCode(String code);

    Optional<Coupon> findByCodeIgnoreCase(String code);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select c from Coupon c where upper(c.code) = upper(:code)")
    Optional<Coupon> findByCodeForUpdate(@Param("code") String code);

    boolean existsByCodeIgnoreCase(String code);

    List<Coupon> findByIsActiveTrueAndValidityEndDateBefore(LocalDate date);
}



