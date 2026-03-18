package com.example.ecommerce.order.service;

import com.example.ecommerce.modal.Order;
import com.example.ecommerce.modal.Seller;
import com.example.ecommerce.modal.Transaction;
import com.example.ecommerce.admin.response.AdminTransactionSummaryResponse;

import java.util.List;

public interface TransactionService {
    Transaction createTransaction(Order order);
    List<AdminTransactionSummaryResponse> getTransactionBySellerId(Seller seller);
    List<AdminTransactionSummaryResponse> getAllTransactions();
}




