package com.example.ecommerce.order.service;

import com.example.ecommerce.modal.User;

import java.util.List;
import java.util.Map;

public interface OrderAftercareService {
    List<Map<String, Object>> getCustomerReturnRequests(Long customerId);

    List<Map<String, Object>> getCustomerExchangeRequests(Long customerId);

    List<Map<String, Object>> getCustomerReturnExchangeRequests(Long customerId);

    Map<String, Object> createReturnRequest(User customer, Long orderItemId, Map<String, Object> payload) throws Exception;

    Map<String, Object> createExchangeRequest(User customer, Long orderItemId, Map<String, Object> payload) throws Exception;

    Map<String, Object> createReturnExchangeRequest(User customer, Long orderItemId, Map<String, Object> payload) throws Exception;

    Map<String, Object> submitDifferencePayment(User customer, Long requestId, String paymentReference) throws Exception;

    Map<String, Object> selectBalanceMode(User customer, Long requestId, String balanceMode) throws Exception;

    Map<String, Object> submitBankDetails(User customer, Long requestId, Map<String, Object> payload) throws Exception;

    List<Map<String, Object>> getAdminReturnRequests();

    Map<String, Object> reviewReturnRequest(Long requestId, Map<String, Object> payload) throws Exception;

    Map<String, Object> initiateRefund(Long requestId, String adminComment) throws Exception;

    Map<String, Object> completeRefund(Long requestId, String adminComment) throws Exception;

    List<Map<String, Object>> getAdminExchangeRequests();

    Map<String, Object> approveExchange(Long requestId, Map<String, Object> payload) throws Exception;

    Map<String, Object> rejectExchange(Long requestId, String adminComment) throws Exception;

    Map<String, Object> createReplacementOrder(Long requestId, String adminComment) throws Exception;
}
