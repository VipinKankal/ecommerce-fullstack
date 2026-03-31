package com.example.ecommerce.order.service.impl;

import com.example.ecommerce.modal.OrderReturnExchangeRequest;
import com.example.ecommerce.order.service.impl.OrderAftercareTaxAdjustmentService;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

final class OrderAftercareResponseMapper {

    private OrderAftercareResponseMapper() {
    }

    static Map<String, Object> toCombinedResponse(
            OrderReturnExchangeRequest request,
            OrderAftercareTaxAdjustmentService taxAdjustmentService
    ) {
        return "EXCHANGE".equalsIgnoreCase(request.getRequestType())
                ? toExchangeResponse(request, taxAdjustmentService)
                : toReturnResponse(request, taxAdjustmentService);
    }

    static Map<String, Object> toSellerReturnResponse(
            OrderReturnExchangeRequest request,
            OrderAftercareTaxAdjustmentService taxAdjustmentService
    ) {
        LinkedHashMap<String, Object> response = new LinkedHashMap<>();
        response.put("id", request.getId());
        response.put("requestNumber", request.getRequestNumber());
        response.put("orderId", request.getOrderId());
        response.put("orderItemId", request.getOrderItemId());
        response.put("customerName", OrderAftercareValueSupport.maskCustomerName(request.getCustomerName()));
        response.put("status", request.getStatus());
        response.put("requestType", request.getRequestType());
        response.put("quantityRequested", request.getQuantityRequested());
        response.put("returnReason", request.getReasonCode());
        response.put("productTitle", request.getProductTitle());
        response.put("productImage", request.getProductImage());
        response.put("requestedAt", request.getRequestedAt());
        response.put("adminReviewedAt", request.getAdminReviewedAt());
        response.put("pickupScheduledAt", request.getPickupScheduledAt());
        response.put("receivedAt", request.getReceivedAt());
        response.put("completedAt", request.getCompletedAt());
        response.put("taxAdjustment", safeReturnTaxAdjustment(request, taxAdjustmentService));
        response.put("history", OrderAftercareValueSupport.toHistory(request));
        return response;
    }

    static Map<String, Object> toSellerExchangeResponse(
            OrderReturnExchangeRequest request,
            OrderAftercareTaxAdjustmentService taxAdjustmentService
    ) {
        LinkedHashMap<String, Object> response = new LinkedHashMap<>();
        response.put("id", request.getId());
        response.put("requestNumber", request.getRequestNumber());
        response.put("oldOrderId", request.getOrderId());
        response.put("oldOrderItemId", request.getOrderItemId());
        response.put("customerName", OrderAftercareValueSupport.maskCustomerName(request.getCustomerName()));
        response.put("status", request.getStatus());
        response.put("oldProductTitle", request.getProductTitle());
        response.put("oldProductImage", request.getProductImage());
        response.put("newProductTitle", request.getRequestedNewProductTitle());
        response.put("newProductImage", request.getRequestedNewProductImage());
        response.put("exchangeReason", request.getReasonCode());
        response.put("requestedAt", request.getRequestedAt());
        response.put("approvedAt", request.getApprovedAt());
        response.put("pickupScheduledAt", request.getPickupScheduledAt());
        response.put("receivedAt", request.getReceivedAt());
        response.put("paymentCompletedAt", request.getPaymentCompletedAt());
        response.put("exchangeCompletedAt", request.getCompletedAt());

        LinkedHashMap<String, Object> priceSummary = new LinkedHashMap<>();
        priceSummary.put("oldPrice", request.getOldPrice());
        priceSummary.put("newPrice", request.getNewPrice());
        priceSummary.put("priceDifference", request.getPriceDifference());
        response.put("priceSummary", priceSummary);

        LinkedHashMap<String, Object> replacementOrder = new LinkedHashMap<>();
        replacementOrder.put("id", request.getReplacementOrderId());
        replacementOrder.put("status", request.getStatus());
        replacementOrder.put("createdAt", request.getReplacementCreatedAt());
        replacementOrder.put("shippedAt", request.getReplacementShippedAt());
        replacementOrder.put("proofUrl", request.getReplacementProofUrl());
        replacementOrder.put("deliveredAt", request.getReplacementDeliveredAt());
        response.put("replacementOrder", replacementOrder);
        response.put("taxAdjustment", safeExchangeTaxAdjustment(request, taxAdjustmentService));
        response.put("history", OrderAftercareValueSupport.toHistory(request));
        return response;
    }

    static Map<String, Object> toReturnResponse(
            OrderReturnExchangeRequest request,
            OrderAftercareTaxAdjustmentService taxAdjustmentService
    ) {
        LinkedHashMap<String, Object> response = new LinkedHashMap<>();
        response.put("id", request.getId());
        response.put("requestNumber", request.getRequestNumber());
        response.put("orderId", request.getOrderId());
        response.put("orderItemId", request.getOrderItemId());
        response.put("customerId", request.getCustomerId());
        response.put("customerName", request.getCustomerName());
        response.put("sellerId", request.getSellerId());
        response.put("requestType", request.getRequestType());
        response.put("status", request.getStatus());
        response.put("quantityRequested", request.getQuantityRequested());
        response.put("reasonCode", request.getReasonCode());
        response.put("returnReason", request.getReasonCode());
        response.put("customerComment", request.getCustomerComment());
        response.put("comment", request.getCustomerComment());
        response.put("adminComment", request.getAdminComment());
        response.put("rejectionReason", request.getRejectionReason());
        response.put("courierId", request.getCourierId());
        response.put("courierName", request.getCourierName());
        response.put("productTitle", request.getProductTitle());
        response.put("productImage", request.getProductImage());
        response.put("itemSellingPrice", request.getOldPrice());
        response.put("requestedAt", request.getRequestedAt());
        response.put("adminReviewedAt", request.getAdminReviewedAt());
        response.put("pickupScheduledAt", request.getPickupScheduledAt());
        response.put("pickupCompletedAt", request.getPickupCompletedAt());
        response.put("pickedAt", request.getPickupCompletedAt());
        response.put("receivedAt", request.getReceivedAt());
        response.put("qcResult", request.getQcResult());
        response.put("warehouseProofUrl", request.getWarehouseProofUrl());
        response.put("refundPendingAt", request.getAdminReviewedAt());
        response.put("refundInitiatedAt", request.getRefundInitiatedAt());
        response.put("refundCompletedAt", request.getRefundCompletedAt());
        response.put("completedAt", request.getCompletedAt());

        LinkedHashMap<String, Object> refund = new LinkedHashMap<>();
        refund.put("eligibleAfter", request.getRefundEligibleAfter());
        refund.put("status", request.getRefundStatus());
        response.put("refund", refund);
        response.put("taxAdjustment", safeReturnTaxAdjustment(request, taxAdjustmentService));
        response.put("history", OrderAftercareValueSupport.toHistory(request));
        return response;
    }

    static Map<String, Object> toExchangeResponse(
            OrderReturnExchangeRequest request,
            OrderAftercareTaxAdjustmentService taxAdjustmentService
    ) {
        LinkedHashMap<String, Object> response = new LinkedHashMap<>();
        response.put("id", request.getId());
        response.put("requestNumber", request.getRequestNumber());
        response.put("oldOrderId", request.getOrderId());
        response.put("oldOrderItemId", request.getOrderItemId());
        response.put("customerId", request.getCustomerId());
        response.put("customerName", request.getCustomerName());
        response.put("oldProductId", request.getProductId());
        response.put("oldProductTitle", request.getProductTitle());
        response.put("oldProductImage", request.getProductImage());
        response.put("newProductId", request.getRequestedNewProductId());
        response.put("newProductTitle", request.getRequestedNewProductTitle());
        response.put("newProductImage", request.getRequestedNewProductImage());
        response.put("requestedVariant", request.getRequestedVariant());
        response.put("exchangeReason", request.getReasonCode());
        response.put("comment", request.getCustomerComment());
        response.put("productPhoto", request.getProductPhoto());
        response.put("status", request.getStatus());
        response.put("oldPrice", request.getOldPrice());
        response.put("newPrice", request.getNewPrice());
        response.put("priceDifference", request.getPriceDifference());
        response.put("courierId", request.getCourierId());
        response.put("courierName", request.getCourierName());
        response.put("adminComment", request.getAdminComment());
        response.put("rejectionReason", request.getRejectionReason());
        response.put("requestedAt", request.getRequestedAt());
        response.put("approvedAt", request.getApprovedAt());
        response.put("pickupScheduledAt", request.getPickupScheduledAt());
        response.put("oldItemPickedAt", request.getPickupCompletedAt());
        response.put("pickupCompletedAt", request.getPickupCompletedAt());
        response.put("paymentCompletedAt", request.getPaymentCompletedAt());
        response.put("receivedAt", request.getReceivedAt());
        response.put("qcResult", request.getQcResult());
        response.put("warehouseProofUrl", request.getWarehouseProofUrl());
        response.put("walletCreditCompletedAt", request.getWalletCreditCompletedAt());
        response.put("bankRefundInitiatedAt", request.getBankRefundInitiatedAt());
        response.put("bankRefundCompletedAt", request.getBankRefundCompletedAt());
        response.put("exchangeCompletedAt", request.getCompletedAt());

        LinkedHashMap<String, Object> bankDetails = new LinkedHashMap<>();
        bankDetails.put("accountHolderName", request.getBankAccountHolderName());
        bankDetails.put("accountNumber", request.getBankAccountNumber());
        bankDetails.put("ifscCode", request.getBankIfscCode());
        bankDetails.put("bankName", request.getBankName());
        bankDetails.put("upiId", request.getBankUpiId());
        response.put("bankDetails", bankDetails);

        LinkedHashMap<String, Object> priceSummary = new LinkedHashMap<>();
        priceSummary.put("oldPrice", request.getOldPrice());
        priceSummary.put("newPrice", request.getNewPrice());
        priceSummary.put("priceDifference", request.getPriceDifference());
        priceSummary.put("customerPaymentRequired", request.getPriceDifference() != null && request.getPriceDifference() > 0);
        priceSummary.put("customerRefundRequired", request.getPriceDifference() != null && request.getPriceDifference() < 0);
        priceSummary.put("balanceMode", request.getBalanceMode());
        response.put("priceSummary", priceSummary);

        LinkedHashMap<String, Object> balanceHandling = new LinkedHashMap<>();
        balanceHandling.put("status", request.getStatus());
        balanceHandling.put("paymentReference", request.getPaymentReference());
        balanceHandling.put("walletCreditStatus", request.getWalletCreditStatus());
        balanceHandling.put("bankRefundStatus", request.getBankRefundStatus());
        balanceHandling.put("bankDetails", bankDetails);
        response.put("balanceHandling", balanceHandling);

        LinkedHashMap<String, Object> exchangePickup = new LinkedHashMap<>();
        exchangePickup.put("status", request.getStatus());
        exchangePickup.put("exchangeStatus", request.getStatus());
        exchangePickup.put("scheduledAt", request.getPickupScheduledAt());
        exchangePickup.put("oldItemPickedAt", request.getPickupCompletedAt());
        exchangePickup.put("completedAt", request.getReceivedAt());
        exchangePickup.put("pickupPhoto", request.getProductPhoto());
        exchangePickup.put("warehouseProofUrl", request.getWarehouseProofUrl());
        exchangePickup.put("qcResult", request.getQcResult());
        exchangePickup.put("note", request.getAdminComment());
        response.put("exchangePickup", exchangePickup);

        LinkedHashMap<String, Object> replacementOrder = new LinkedHashMap<>();
        replacementOrder.put("id", request.getReplacementOrderId());
        replacementOrder.put("replacementOrderNumber",
                request.getReplacementOrderId() == null ? null : "RPL-" + request.getReplacementOrderId());
        replacementOrder.put("status", request.getStatus());
        replacementOrder.put("createdAt", request.getReplacementCreatedAt());
        replacementOrder.put("shippedAt", request.getReplacementShippedAt());
        replacementOrder.put("proofUrl", request.getReplacementProofUrl());
        replacementOrder.put("deliveredAt", request.getReplacementDeliveredAt());
        response.put("replacementOrder", replacementOrder);
        response.put("taxAdjustment", safeExchangeTaxAdjustment(request, taxAdjustmentService));
        response.put("history", OrderAftercareValueSupport.toHistory(request));
        return response;
    }

    private static Map<String, Object> safeReturnTaxAdjustment(
            OrderReturnExchangeRequest request,
            OrderAftercareTaxAdjustmentService taxAdjustmentService
    ) {
        if (taxAdjustmentService == null) {
            return Map.of();
        }
        return taxAdjustmentService.buildReturnTaxAdjustment(request);
    }

    private static Map<String, Object> safeExchangeTaxAdjustment(
            OrderReturnExchangeRequest request,
            OrderAftercareTaxAdjustmentService taxAdjustmentService
    ) {
        if (taxAdjustmentService == null) {
            return Map.of();
        }
        return taxAdjustmentService.buildExchangeTaxAdjustment(request);
    }
}
