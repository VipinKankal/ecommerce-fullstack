package com.example.ecommerce.admin.controller;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
class CreateCourierRequest {
    private String fullName;
    private String phone;
    private String email;
    private String city;
    private String zone;
    private String vehicleNumber;
    private String kycIdNumber;
    private String kycDocUrl;
    private String status;
    private String codSettlementFrequency;
    private SalaryConfigPayload salaryConfig;
}

@Data
@NoArgsConstructor
class SalaryConfigPayload {
    private Integer monthlyBase;
    private Integer perDeliveryRate;
    private Integer petrolAllowanceMonthlyCap;
    private Integer targetDeliveries;
    private Integer incentiveAmount;
    private Integer latePenalty;
    private Integer failedPenalty;
    private Integer codMismatchPenalty;
}

@Data
@NoArgsConstructor
class ReviewStatusPayload {
    private String status;
}

@Data
@NoArgsConstructor
class PetrolClaimReviewPayload {
    private String status;
    private String reviewerNote;
}

@Data
@NoArgsConstructor
class PayrollRunRequest {
    private String month;
}

@Data
@NoArgsConstructor
class MonthPayload {
    private String month;
}

@Data
@NoArgsConstructor
class PayoutRequest {
    private Long courierId;
    private String month;
    private String payoutMode;
    private String referenceNumber;
}

@Data
@NoArgsConstructor
class CourierRecord {
    private Long id;
    private String fullName;
    private String phone;
    private String email;
    private String city;
    private String zone;
    private String status;
    private String kycStatus;
    private String createdAt;
    private Integer activeOrders;
    private Integer deliveriesThisMonth;
    private String codSettlementFrequency;
}

@Data
@NoArgsConstructor
class CodSettlementRecord {
    private Long id;
    private Long orderId;
    private Long courierId;
    private String courierName;
    private Integer amount;
    private String paymentMode;
    private String collectedAt;
    private String status;
    private String depositDate;
    private String transactionId;
}

@Data
@NoArgsConstructor
class PetrolClaimRecord {
    private Long id;
    private Long courierId;
    private String courierName;
    private String month;
    private Integer amount;
    private String status;
    private String receiptUrl;
    private String notes;
}

@Data
@NoArgsConstructor
class PayrollRowRecord {
    private Long id;
    private Long courierId;
    private String courierName;
    private String month;
    private Integer baseSalary;
    private Integer presentDays;
    private Integer payableDays;
    private Integer deliveriesCount;
    private Integer perDeliveryEarnings;
    private Integer petrolAllowanceApproved;
    private Integer incentiveAmount;
    private Integer penalties;
    private Integer totalPayable;
    private String payoutStatus;
    private String paidAt;
    private String payoutReference;
}
