package com.example.ecommerce.admin.service.impl;

import com.example.ecommerce.common.domain.AccountStatus;
import com.example.ecommerce.modal.Order;
import com.example.ecommerce.modal.OrderReturnExchangeRequest;
import com.example.ecommerce.modal.Product;
import com.example.ecommerce.modal.ProductVariant;
import com.example.ecommerce.modal.Transaction;
import com.example.ecommerce.modal.User;
import com.example.ecommerce.modal.WarehouseTransferRequest;
import com.example.ecommerce.repository.OrderRepository;
import com.example.ecommerce.repository.OrderReturnExchangeRequestRepository;
import com.example.ecommerce.repository.ProductRepository;
import com.example.ecommerce.repository.SellerRepository;
import com.example.ecommerce.repository.TransactionRepository;
import com.example.ecommerce.repository.UserRepository;
import com.example.ecommerce.repository.WarehouseTransferRequestRepository;
import com.example.ecommerce.admin.response.AdminDashboardSummaryResponse;
import com.example.ecommerce.admin.response.AdminOrderSummaryResponse;
import com.example.ecommerce.admin.response.AdminProductSummaryResponse;
import com.example.ecommerce.admin.response.AdminSalesReportResponse;
import com.example.ecommerce.admin.response.AdminTransactionSummaryResponse;
import com.example.ecommerce.admin.response.AdminUserSummaryResponse;
import com.example.ecommerce.admin.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminServiceImpl implements AdminService {

    private final UserRepository userRepository;
    private final SellerRepository sellerRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final TransactionRepository transactionRepository;
    private final OrderReturnExchangeRequestRepository requestRepository;
    private final WarehouseTransferRequestRepository warehouseTransferRequestRepository;

    @Override
    public AdminDashboardSummaryResponse getDashboardSummary() {
        List<Order> orders = orderRepository.findAllByOrderByOrderDateDesc();
        List<OrderReturnExchangeRequest> requests = requestRepository.findAll();
        List<WarehouseTransferRequest> transfers = warehouseTransferRequestRepository.findAll();
        List<Product> products = productRepository.findAllByOrderByCreatedAtDesc();
        LocalDate today = LocalDate.now();
        AdminDashboardSummaryResponse response = new AdminDashboardSummaryResponse();
        response.setTotalUsers(userRepository.count());
        response.setTotalSellers(sellerRepository.count());
        response.setActiveSellers(sellerRepository.findByAccountStatus(AccountStatus.ACTIVE).size());
        response.setPendingSellers(sellerRepository.findByAccountStatus(AccountStatus.PENDING_VERIFICATION).size());
        response.setTotalProducts(productRepository.count());
        response.setTotalOrders(orders.size());
        response.setTotalTransactions(transactionRepository.count());
        response.setGrossMerchandiseValue(
                orders.stream().mapToLong(order -> order.getTotalSellingPrice() == null ? 0 : order.getTotalSellingPrice()).sum()
        );
        response.setTodayInbound(
                transfers.stream()
                        .filter(transfer -> transfer.getReceivedAt() != null && transfer.getReceivedAt().toLocalDate().isEqual(today))
                        .count()
        );
        response.setTodayShipped(
                orders.stream()
                        .filter(order -> order.getShippedAt() != null && order.getShippedAt().toLocalDate().isEqual(today))
                        .count()
                        + requests.stream()
                        .filter(request -> request.getReplacementShippedAt() != null
                                && request.getReplacementShippedAt().toLocalDate().isEqual(today))
                        .count()
        );
        response.setPendingReturns(
                requests.stream()
                        .filter(request -> "RETURN".equalsIgnoreCase(request.getRequestType()))
                        .filter(request -> !Set.of("RETURN_REJECTED", "RETURNED").contains(normalize(request.getStatus())))
                        .count()
        );
        response.setPendingExchanges(
                requests.stream()
                        .filter(request -> "EXCHANGE".equalsIgnoreCase(request.getRequestType()))
                        .filter(request -> !Set.of("EXCHANGE_REJECTED", "EXCHANGE_COMPLETED").contains(normalize(request.getStatus())))
                        .count()
        );
        response.setPendingTransfers(
                transfers.stream()
                        .filter(transfer -> !Set.of("TRANSFER_COMPLETED", "TRANSFER_REJECTED", "TRANSFER_CANCELLED")
                                .contains(normalize(transfer.getStatus() == null ? null : transfer.getStatus().name())))
                        .count()
        );
        response.setLowStockAlerts(
                products.stream()
                        .filter(product -> {
                            int warehouseStock = product.getWarehouseStock();
                            int threshold = product.getLowStockThreshold();
                            return warehouseStock <= threshold;
                        })
                        .count()
        );
        return response;
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toUpperCase();
    }

    @Override
    public List<AdminUserSummaryResponse> getUsers() {
        return userRepository.findAllByOrderByIdDesc().stream().map(this::mapUser).toList();
    }

    @Override
    public AdminUserSummaryResponse updateUserStatus(Long id, AccountStatus status) throws Exception {
        User user = userRepository.findById(id).orElseThrow(() -> new Exception("User not found"));
        user.setAccountStatus(status);
        return mapUser(userRepository.save(user));
    }

    @Override
    @Transactional(readOnly = true)
    public List<AdminProductSummaryResponse> getProducts() {
        return productRepository.findAllByOrderByCreatedAtDesc().stream().map(this::mapProduct).toList();
    }

    @Override
    public List<AdminOrderSummaryResponse> getOrders() {
        return orderRepository.findAllByOrderByOrderDateDesc().stream().map(this::mapOrder).toList();
    }

    @Override
    public List<AdminTransactionSummaryResponse> getPayments() {
        return transactionRepository.findAllByOrderByDateDesc().stream().map(this::mapTransaction).toList();
    }

    @Override
    public AdminSalesReportResponse getSalesReport() {
        List<Order> orders = orderRepository.findAllByOrderByOrderDateDesc();
        List<Transaction> transactions = transactionRepository.findAllByOrderByDateDesc();

        AdminSalesReportResponse response = new AdminSalesReportResponse();
        response.setTotalRevenue(orders.stream().mapToLong(order -> order.getTotalSellingPrice() == null ? 0 : order.getTotalSellingPrice()).sum());
        response.setTotalOrders(orders.size());
        response.setDeliveredOrders(orders.stream().filter(order -> order.getOrderStatus() != null && order.getOrderStatus().name().equals("DELIVERED")).count());
        response.setCancelledOrders(orders.stream().filter(order -> order.getOrderStatus() != null && order.getOrderStatus().name().equals("CANCELLED")).count());
        response.setTotalTransactions(transactions.size());

        Map<String, Long> categoryTotals = orders.stream()
                .flatMap(order -> order.getOrderItems().stream())
                .collect(Collectors.groupingBy(
                        item -> {
                            if (item.getProduct() == null || item.getProduct().getCategory() == null) {
                                return "Uncategorized";
                            }
                            String name = item.getProduct().getCategory().getName();
                            return name == null || name.isBlank() ? "Uncategorized" : name;
                        },
                        Collectors.counting()
                ));

        Map<String, Long> sellerTotals = orders.stream()
                .collect(Collectors.groupingBy(
                        order -> {
                            if (order.getOrderItems() == null || order.getOrderItems().isEmpty()) {
                                return "Unknown Seller";
                            }
                            if (order.getOrderItems().get(0).getProduct() == null || order.getOrderItems().get(0).getProduct().getSeller() == null) {
                                return "Unknown Seller";
                            }
                            String sellerName = order.getOrderItems().get(0).getProduct().getSeller().getSellerName();
                            return sellerName == null || sellerName.isBlank() ? "Unknown Seller" : sellerName;
                        },
                        Collectors.summingLong(order -> order.getTotalSellingPrice() == null ? 0 : order.getTotalSellingPrice())
                ));

        response.setTopCategories(toMetricItems(categoryTotals));
        response.setTopSellers(toMetricItems(sellerTotals));
        return response;
    }

    private List<AdminSalesReportResponse.MetricItem> toMetricItems(Map<String, Long> source) {
        return source.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue(Comparator.reverseOrder()))
                .limit(5)
                .map(entry -> {
                    AdminSalesReportResponse.MetricItem item = new AdminSalesReportResponse.MetricItem();
                    item.setLabel(entry.getKey());
                    item.setValue(entry.getValue());
                    return item;
                })
                .toList();
    }

    private AdminUserSummaryResponse mapUser(User user) {
        AdminUserSummaryResponse response = new AdminUserSummaryResponse();
        response.setId(user.getId());
        response.setFullName(user.getFullName());
        response.setEmail(user.getEmail());
        response.setMobileNumber(user.getMobileNumber());
        response.setRole(user.getRole());
        response.setAccountStatus(user.getAccountStatus());
        return response;
    }

    private AdminProductSummaryResponse mapProduct(Product product) {
        AdminProductSummaryResponse response = new AdminProductSummaryResponse();
        response.setId(product.getId());
        response.setTitle(product.getTitle());
        response.setCategoryName(product.getCategory() != null ? product.getCategory().getName() : null);
        response.setSellerName(product.getSeller() != null ? product.getSeller().getSellerName() : null);
        response.setQuantity(product.getQuantity());
        response.setSellerStock(product.getSellerStock());
        response.setWarehouseStock(product.getWarehouseStock());
        response.setLowStockThreshold(product.getLowStockThreshold());
        response.setSellingPrice(product.getSellingPrice());
        response.setMrpPrice(product.getMrpPrice());
        response.setCreatedAt(product.getCreatedAt());
        response.setVariants(
                product.getVariants() == null
                        ? java.util.List.of()
                        : product.getVariants().stream().map(this::mapVariant).toList()
        );
        return response;
    }

    private AdminProductSummaryResponse.VariantSummary mapVariant(ProductVariant variant) {
        AdminProductSummaryResponse.VariantSummary summary = new AdminProductSummaryResponse.VariantSummary();
        summary.setId(variant.getId());
        summary.setVariantType(variant.getVariantType());
        summary.setVariantValue(variant.getVariantValue());
        summary.setSize(variant.getSize());
        summary.setColor(variant.getColor());
        summary.setSku(variant.getSku());
        summary.setPrice(variant.getPrice());
        summary.setSellerStock(variant.getSellerStock());
        summary.setWarehouseStock(variant.getWarehouseStock());
        return summary;
    }

    private AdminOrderSummaryResponse mapOrder(Order order) {
        AdminOrderSummaryResponse response = new AdminOrderSummaryResponse();
        response.setId(order.getId());
        response.setCustomerName(order.getUser() != null ? order.getUser().getFullName() : null);
        response.setCustomerEmail(order.getUser() != null ? order.getUser().getEmail() : null);
        response.setSellerName(
                order.getOrderItems() == null || order.getOrderItems().isEmpty() || order.getOrderItems().get(0).getProduct() == null || order.getOrderItems().get(0).getProduct().getSeller() == null
                        ? null
                        : order.getOrderItems().get(0).getProduct().getSeller().getSellerName()
        );
        response.setOrderStatus(order.getOrderStatus());
        response.setPaymentStatus(order.getPaymentStatus());
        response.setPaymentMethod(order.getPaymentMethod());
        response.setPaymentType(order.getPaymentType());
        response.setProvider(order.getProvider());
        response.setTotalSellingPrice(order.getTotalSellingPrice());
        response.setTotalItems(order.getTotalItems());
        response.setOrderDate(order.getOrderDate());
        return response;
    }

    private AdminTransactionSummaryResponse mapTransaction(Transaction transaction) {
        AdminTransactionSummaryResponse response = new AdminTransactionSummaryResponse();
        response.setId(transaction.getId());
        response.setDate(transaction.getDate());
        response.setCustomerName(transaction.getCustomer() != null ? transaction.getCustomer().getFullName() : null);
        response.setCustomerEmail(transaction.getCustomer() != null ? transaction.getCustomer().getEmail() : null);
        response.setSellerName(transaction.getSeller() != null ? transaction.getSeller().getSellerName() : null);
        response.setAmount(transaction.getOrder() != null ? transaction.getOrder().getTotalSellingPrice() : 0);
        response.setOrderStatus(transaction.getOrder() != null && transaction.getOrder().getOrderStatus() != null ? transaction.getOrder().getOrderStatus().name() : null);
        response.setPaymentStatus(transaction.getOrder() != null && transaction.getOrder().getPaymentStatus() != null ? transaction.getOrder().getPaymentStatus().name() : null);
        return response;
    }
}






