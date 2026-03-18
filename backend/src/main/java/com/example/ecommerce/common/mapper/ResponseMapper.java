package com.example.ecommerce.common.mapper;

import com.example.ecommerce.modal.Address;
import com.example.ecommerce.modal.Category;
import com.example.ecommerce.modal.Order;
import com.example.ecommerce.modal.OrderItem;
import com.example.ecommerce.modal.Product;
import com.example.ecommerce.modal.Seller;
import com.example.ecommerce.modal.User;
import com.example.ecommerce.catalog.response.ProductResponse;
import com.example.ecommerce.seller.response.SellerOrderResponse;
import com.example.ecommerce.seller.response.SellerResponse;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

public final class ResponseMapper {

    private ResponseMapper() {
    }

    public static ProductResponse toProductResponse(Product product) {
        if (product == null) {
            return null;
        }

        ProductResponse response = new ProductResponse();
        response.setId(product.getId());
        response.setTitle(product.getTitle());
        response.setDescription(product.getDescription());
        response.setMrpPrice(product.getMrpPrice());
        response.setSellingPrice(product.getSellingPrice());
        response.setDiscountPercent(product.getDiscountPercentage());
        response.setDiscountPercentage(product.getDiscountPercentage());
        response.setQuantity(product.getQuantity());
        response.setColor(product.getColor());
        response.setImages(product.getImages() == null ? Collections.emptyList() : product.getImages());
        response.setNumRatings(product.getNumRatings());
        response.setCategory(toCategorySummary(product.getCategory()));
        response.setSeller(toSellerSummary(product.getSeller()));
        response.setCreatedAt(product.getCreatedAt());
        response.setSize(product.getSize());
        response.setSizes(product.getSize());
        return response;
    }

    public static List<ProductResponse> toProductResponses(List<Product> products) {
        return products == null ? Collections.emptyList() : products.stream().map(ResponseMapper::toProductResponse).collect(Collectors.toList());
    }

    public static SellerResponse toSellerResponse(Seller seller) {
        if (seller == null) {
            return null;
        }

        SellerResponse response = new SellerResponse();
        response.setId(seller.getId());
        response.setSellerName(seller.getSellerName());
        response.setMobileNumber(seller.getMobileNumber());
        response.setEmail(seller.getEmail());
        response.setDateOfBirth(seller.getDateOfBirth());
        response.setGSTIN(seller.getGSTIN());
        response.setEmailVerified(seller.getEmailVerified());
        response.setAccountStatus(seller.getAccountStatus());
        response.setRole(seller.getRole());

        SellerResponse.BusinessDetailsPayload businessDetails = new SellerResponse.BusinessDetailsPayload();
        if (seller.getBusinessDetails() != null) {
            businessDetails.setBusinessName(seller.getBusinessDetails().getBusinessName());
            businessDetails.setBusinessType(seller.getBusinessDetails().getBusinessType());
            businessDetails.setGstNumber(seller.getBusinessDetails().getGstNumber());
            businessDetails.setPanNumber(seller.getBusinessDetails().getPanNumber());
        }
        response.setBusinessDetails(businessDetails);

        SellerResponse.BankDetailsPayload bankDetails = new SellerResponse.BankDetailsPayload();
        if (seller.getBankDetails() != null) {
            bankDetails.setAccountHolderName(seller.getBankDetails().getAccountHolderName());
            bankDetails.setBankName(seller.getBankDetails().getBankName());
            bankDetails.setAccountNumber(seller.getBankDetails().getAccountNumber());
            bankDetails.setIfscCode(seller.getBankDetails().getIfscCode());
        }
        response.setBankDetails(bankDetails);

        SellerResponse.KycDetailsPayload kycDetails = new SellerResponse.KycDetailsPayload();
        if (seller.getKycDetails() != null) {
            kycDetails.setPanCardUrl(seller.getKycDetails().getPanCardUrl());
            kycDetails.setAadhaarCardUrl(seller.getKycDetails().getAadhaarCardUrl());
            kycDetails.setGstCertificateUrl(seller.getKycDetails().getGstCertificateUrl());
        }
        response.setKycDetails(kycDetails);

        SellerResponse.StoreDetailsPayload storeDetails = new SellerResponse.StoreDetailsPayload();
        if (seller.getStoreDetails() != null) {
            storeDetails.setStoreName(seller.getStoreDetails().getStoreName());
            storeDetails.setStoreLogo(seller.getStoreDetails().getStoreLogo());
            storeDetails.setStoreDescription(seller.getStoreDetails().getStoreDescription());
            storeDetails.setPrimaryCategory(seller.getStoreDetails().getPrimaryCategory());
            storeDetails.setSupportEmail(seller.getStoreDetails().getSupportEmail());
            storeDetails.setSupportPhone(seller.getStoreDetails().getSupportPhone());
        }
        response.setStoreDetails(storeDetails);
        response.setPickupAddress(toSellerAddress(seller.getPickupAddress()));
        return response;
    }

    public static List<SellerResponse> toSellerResponses(List<Seller> sellers) {
        return sellers == null ? Collections.emptyList() : sellers.stream().map(ResponseMapper::toSellerResponse).collect(Collectors.toList());
    }

    public static SellerOrderResponse toSellerOrderResponse(Order order) {
        if (order == null) {
            return null;
        }

        SellerOrderResponse response = new SellerOrderResponse();
        response.setId(order.getId());
        response.setOrderId(order.getOrderId());
        response.setSellerId(order.getSellerId());
        response.setOrderStatus(order.getOrderStatus());
        response.setPaymentStatus(order.getPaymentStatus());
        response.setTotalMrpPrice(order.getTotalMrpPrice());
        response.setTotalSellingPrice(order.getTotalSellingPrice());
        response.setDiscount(order.getDiscount());
        response.setTotalItems(order.getTotalItems());
        response.setCancelReasonCode(order.getCancelReasonCode());
        response.setCancelReasonText(order.getCancelReasonText());
        response.setCancelledAt(order.getCancelledAt());
        response.setOrderDate(order.getOrderDate());
        response.setDeliveryDate(order.getDeliveryDate());
        response.setUser(toCustomerSummary(order.getUser()));
        response.setShippingAddress(toOrderAddress(order.getShippingAddress()));
        response.setOrderItems(order.getOrderItems() == null ? Collections.emptyList() : order.getOrderItems().stream().map(ResponseMapper::toOrderItemSummary).collect(Collectors.toList()));
        return response;
    }

    public static List<SellerOrderResponse> toSellerOrderResponses(List<Order> orders) {
        return orders == null ? Collections.emptyList() : orders.stream().map(ResponseMapper::toSellerOrderResponse).collect(Collectors.toList());
    }

    private static ProductResponse.CategorySummary toCategorySummary(Category category) {
        if (category == null) {
            return null;
        }
        ProductResponse.CategorySummary summary = new ProductResponse.CategorySummary();
        summary.setId(category.getId());
        summary.setName(category.getName());
        summary.setCategoryId(category.getCategoryId());
        summary.setLevel(category.getLevel());
        return summary;
    }

    private static ProductResponse.SellerSummary toSellerSummary(Seller seller) {
        if (seller == null) {
            return null;
        }
        ProductResponse.SellerSummary summary = new ProductResponse.SellerSummary();
        summary.setId(seller.getId());
        summary.setSellerName(seller.getSellerName());
        summary.setEmail(seller.getEmail());
        return summary;
    }

    private static SellerResponse.AddressPayload toSellerAddress(Address address) {
        if (address == null) {
            return null;
        }
        SellerResponse.AddressPayload payload = new SellerResponse.AddressPayload();
        payload.setId(address.getId());
        payload.setName(address.getName());
        payload.setStreet(address.getStreet());
        payload.setLocality(address.getLocality());
        payload.setAddress(address.getAddress());
        payload.setCity(address.getCity());
        payload.setState(address.getState());
        payload.setPinCode(address.getPinCode());
        payload.setMobileNumber(address.getMobileNumber());
        payload.setCountry(address.getCountry());
        return payload;
    }

    private static SellerOrderResponse.CustomerSummary toCustomerSummary(User user) {
        if (user == null) {
            return null;
        }
        SellerOrderResponse.CustomerSummary summary = new SellerOrderResponse.CustomerSummary();
        summary.setId(user.getId());
        summary.setFullName(user.getFullName());
        summary.setEmail(user.getEmail());
        summary.setMobileNumber(user.getMobileNumber());
        return summary;
    }

    private static SellerOrderResponse.AddressSummary toOrderAddress(Address address) {
        if (address == null) {
            return null;
        }
        SellerOrderResponse.AddressSummary summary = new SellerOrderResponse.AddressSummary();
        summary.setId(address.getId());
        summary.setName(address.getName());
        summary.setStreet(address.getStreet());
        summary.setLocality(address.getLocality());
        summary.setAddress(address.getAddress());
        summary.setCity(address.getCity());
        summary.setState(address.getState());
        summary.setPinCode(address.getPinCode());
        summary.setMobileNumber(address.getMobileNumber());
        summary.setCountry(address.getCountry());
        return summary;
    }

    private static SellerOrderResponse.OrderItemSummary toOrderItemSummary(OrderItem item) {
        SellerOrderResponse.OrderItemSummary summary = new SellerOrderResponse.OrderItemSummary();
        summary.setId(item.getId());
        summary.setProduct(toOrderProductSummary(item.getProduct()));
        summary.setSize(item.getSize());
        summary.setQuantity(item.getQuantity());
        summary.setMrpPrice(item.getMrpPrice());
        summary.setSellingPrice(item.getSellingPrice());
        summary.setUserId(item.getUserId());
        return summary;
    }

    private static SellerOrderResponse.ProductSummary toOrderProductSummary(Product product) {
        if (product == null) {
            return null;
        }
        SellerOrderResponse.ProductSummary summary = new SellerOrderResponse.ProductSummary();
        summary.setId(product.getId());
        summary.setTitle(product.getTitle());
        summary.setDescription(product.getDescription());
        summary.setColor(product.getColor());
        summary.setImages(product.getImages() == null ? Collections.emptyList() : product.getImages());
        return summary;
    }
}




