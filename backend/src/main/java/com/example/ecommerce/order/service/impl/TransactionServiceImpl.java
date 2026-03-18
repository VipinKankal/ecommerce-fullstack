package com.example.ecommerce.order.service.impl;

import com.example.ecommerce.modal.Order;
import com.example.ecommerce.modal.Seller;
import com.example.ecommerce.modal.Transaction;
import com.example.ecommerce.repository.SellerRepository;
import com.example.ecommerce.repository.TransactionRepository;
import com.example.ecommerce.admin.response.AdminTransactionSummaryResponse;
import com.example.ecommerce.order.service.TransactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TransactionServiceImpl implements TransactionService {

    private final TransactionRepository transactionRepository;
    private final SellerRepository sellerRepository;

    @Override
    public Transaction createTransaction(Order order) {
        Seller seller = sellerRepository.findById(order.getSellerId()).get();
        Transaction transaction = new Transaction();
        transaction.setSeller(seller);
        transaction.setCustomer(order.getUser());
        transaction.setOrder(order);
        return transactionRepository.save(transaction);
    }

    @Override
    public List<AdminTransactionSummaryResponse> getTransactionBySellerId(Seller seller) {
        return transactionRepository.findBySellerId(seller.getId()).stream().map(this::mapTransaction).toList();
    }

    @Override
    public List<AdminTransactionSummaryResponse> getAllTransactions() {
        return transactionRepository.findAllByOrderByDateDesc().stream().map(this::mapTransaction).toList();
    }

    private AdminTransactionSummaryResponse mapTransaction(Transaction transaction) {
        AdminTransactionSummaryResponse response = new AdminTransactionSummaryResponse();
        response.setId(transaction.getId());
        response.setDate(transaction.getDate());
        response.setCustomerName(transaction.getCustomer() != null ? transaction.getCustomer().getFullName() : null);
        response.setCustomerEmail(transaction.getCustomer() != null ? transaction.getCustomer().getEmail() : null);
        response.setCustomerPhone(transaction.getCustomer() != null ? transaction.getCustomer().getMobileNumber() : null);
        response.setSellerName(transaction.getSeller() != null ? transaction.getSeller().getSellerName() : null);
        response.setAmount(transaction.getOrder() != null ? transaction.getOrder().getTotalSellingPrice() : 0);
        response.setOrderStatus(transaction.getOrder() != null && transaction.getOrder().getOrderStatus() != null ? transaction.getOrder().getOrderStatus().name() : null);
        response.setPaymentStatus(transaction.getOrder() != null && transaction.getOrder().getPaymentStatus() != null ? transaction.getOrder().getPaymentStatus().name() : null);
        return response;
    }
}

