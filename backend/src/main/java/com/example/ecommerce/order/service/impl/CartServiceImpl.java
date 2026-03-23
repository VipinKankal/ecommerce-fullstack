package com.example.ecommerce.order.service.impl;

import com.example.ecommerce.common.domain.CouponScopeType;
import com.example.ecommerce.common.domain.CouponDiscountType;
import com.example.ecommerce.modal.Cart;
import com.example.ecommerce.modal.CartItem;
import com.example.ecommerce.modal.Coupon;
import com.example.ecommerce.modal.Product;
import com.example.ecommerce.modal.ProductVariant;
import com.example.ecommerce.modal.User;
import com.example.ecommerce.repository.CartItemRepository;
import com.example.ecommerce.repository.CartRepository;
import com.example.ecommerce.repository.CouponRepository;
import com.example.ecommerce.repository.CouponUsageRepository;
import com.example.ecommerce.repository.ProductVariantRepository;
import com.example.ecommerce.order.service.CartService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class CartServiceImpl implements CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductVariantRepository productVariantRepository;
    private final CouponRepository couponRepository;
    private final CouponUsageRepository couponUsageRepository;

    @Override
    public CartItem addItemToCart(User user, Product product, String size, int quantity) {
        if (quantity <= 0) {
            throw new IllegalArgumentException("Quantity must be at least 1");
        }
        ProductVariant variant = resolveVariant(product, size);
        int availableStock = variant != null
                ? Math.max(variant.getWarehouseStock() == null ? 0 : variant.getWarehouseStock(), 0)
                : product.getWarehouseStock();
        if (availableStock <= 0) {
            throw new IllegalArgumentException("Product is out of stock");
        }
        if (quantity > availableStock) {
            throw new IllegalArgumentException("Only " + availableStock + " items left in stock");
        }

        Cart cart=findUserCart(user);

        CartItem isPresent = cartItemRepository.findByCartAndProductAndSize(cart, product, size);

        if (isPresent==null) {
            CartItem cartItem = new CartItem();
            cartItem.setProduct(product);
            cartItem.setQuantity(quantity);
            cartItem.setUserId(user.getId());
            cartItem.setSize(size);
            cartItem.setCart(cart);
            int totalPrice = quantity * product.getSellingPrice();
            int totalMrpPrice = quantity * product.getMrpPrice();
            cartItem.setMrpPrice(totalMrpPrice);
            cartItem.setSellingPrice(totalPrice);
            cart.getCartItems().add(cartItem);
            cartItem.setCart(cart);
            return cartItemRepository.save(cartItem);
        }
        int nextQuantity = isPresent.getQuantity() + quantity;
        if (nextQuantity > availableStock) {
            throw new IllegalArgumentException("Only " + availableStock + " items left in stock");
        }
        isPresent.setQuantity(nextQuantity);
        isPresent.setMrpPrice(nextQuantity * product.getMrpPrice());
        isPresent.setSellingPrice(nextQuantity * product.getSellingPrice());
        return cartItemRepository.save(isPresent);
    }

    private ProductVariant resolveVariant(Product product, String size) {
        if (product == null || product.getId() == null || size == null || size.isBlank()) {
            return null;
        }
        return productVariantRepository.findByProductIdAndSizeIgnoreCase(product.getId(), size.trim())
                .orElse(null);
    }

    @Override
    public Cart findUserCart(User user) {
        Cart cart = cartRepository.findByUserId(user.getId());

        // If there is no cart for this user, create and persist an empty one so callers don't get null
        if (cart == null) {
            cart = new Cart();
            cart.setUser(user);
            cart = cartRepository.save(cart);
        }

        int totalPrice = 0;
        double subtotalSellingPrice = 0;
        int totalItems = 0;
 
        for (CartItem cartItem : cart.getCartItems()) {
            // Ensure nested product media is initialized before JSON serialization.
            if (cartItem.getProduct() != null && cartItem.getProduct().getImages() != null) {
                cartItem.getProduct().getImages().size();
            }

            int mrp = cartItem.getMrpPrice() != null ? cartItem.getMrpPrice() : 0;
            int selling = cartItem.getSellingPrice() != null ? cartItem.getSellingPrice() : 0;

            totalPrice += mrp;
            subtotalSellingPrice += selling;
            totalItems += cartItem.getQuantity();
        }

        double couponDiscountAmount = resolveCouponDiscountAmount(user, cart, subtotalSellingPrice);
        double finalSellingPrice = Math.max(0, subtotalSellingPrice - couponDiscountAmount);

        cart.setTotalMrpPrice(totalPrice);
        cart.setTotalItems(totalItems);
        cart.setCouponDiscountAmount(couponDiscountAmount);
        cart.setTotalSellingPrice(roundCurrency(finalSellingPrice));
        cart.setDiscount((int) Math.round(totalPrice - finalSellingPrice));
        cart.setTotalItems(totalItems);
        return cart;
    }

    private double resolveCouponDiscountAmount(User user, Cart cart, double subtotalSellingPrice) {
        if (cart.getCouponCode() == null || cart.getCouponCode().isBlank() || subtotalSellingPrice <= 0) {
            cart.setCouponDiscountAmount(0.0);
            return 0;
        }

        Coupon coupon = couponRepository.findByCodeIgnoreCase(cart.getCouponCode()).orElse(null);
        if (coupon == null || !coupon.isActive()) {
            cart.setCouponCode(null);
            cart.setCouponDiscountAmount(0.0);
            return 0;
        }

        if (coupon.getMinimumOrderValue() > subtotalSellingPrice) {
            cart.setCouponCode(null);
            cart.setCouponDiscountAmount(0.0);
            return 0;
        }

        java.time.LocalDate today = java.time.LocalDate.now();
        boolean afterStart = coupon.getValidityStartDate() == null || !today.isBefore(coupon.getValidityStartDate());
        boolean beforeEnd = coupon.getValidityEndDate() == null || !today.isAfter(coupon.getValidityEndDate());
        if (!afterStart || !beforeEnd) {
            cart.setCouponCode(null);
            cart.setCouponDiscountAmount(0.0);
            return 0;
        }

        if (coupon.getUsageLimit() != null && coupon.getUsedCount() != null && coupon.getUsedCount() >= coupon.getUsageLimit()) {
            cart.setCouponCode(null);
            cart.setCouponDiscountAmount(0.0);
            return 0;
        }

        int perUserLimit = coupon.getPerUserLimit() == null ? 1 : coupon.getPerUserLimit();
        if (couponUsageRepository.countByCouponIdAndUserId(coupon.getId(), user.getId()) >= perUserLimit) {
            cart.setCouponCode(null);
            cart.setCouponDiscountAmount(0.0);
            return 0;
        }

        double applicableSubtotal = calculateApplicableSubtotal(coupon, cart);
        if (applicableSubtotal <= 0) {
            cart.setCouponCode(null);
            cart.setCouponDiscountAmount(0.0);
            return 0;
        }

        double discountAmount = calculateCouponDiscount(coupon, applicableSubtotal);
        cart.setCouponDiscountAmount(discountAmount);
        cart.setCouponCode(coupon.getCode());
        return discountAmount;
    }

    private double calculateApplicableSubtotal(Coupon coupon, Cart cart) {
        if (cart.getCartItems() == null) {
            return 0;
        }
        return cart.getCartItems().stream()
                .filter(item -> isItemApplicable(coupon, item))
                .map(CartItem::getSellingPrice)
                .filter(value -> value != null)
                .mapToDouble(Integer::doubleValue)
                .sum();
    }

    private boolean isItemApplicable(Coupon coupon, CartItem item) {
        if (coupon == null || item == null || item.getProduct() == null) {
            return false;
        }
        CouponScopeType scopeType = coupon.getScopeType() == null ? CouponScopeType.GLOBAL : coupon.getScopeType();
        Long scopeId = coupon.getScopeId();
        if (scopeType == CouponScopeType.GLOBAL || scopeId == null) {
            return true;
        }
        return switch (scopeType) {
            case SELLER -> item.getProduct().getSeller() != null && scopeId.equals(item.getProduct().getSeller().getId());
            case CATEGORY -> item.getProduct().getCategory() != null && scopeId.equals(item.getProduct().getCategory().getId());
            case PRODUCT -> item.getProduct().getId() != null && scopeId.equals(item.getProduct().getId());
            case GLOBAL -> true;
        };
    }

    private double calculateCouponDiscount(Coupon coupon, double subtotalSellingPrice) {
        double discountAmount;
        CouponDiscountType discountType = coupon.getDiscountType() == null
                ? CouponDiscountType.PERCENT
                : coupon.getDiscountType();

        if (discountType == CouponDiscountType.FLAT) {
            discountAmount = coupon.getDiscountValue();
        } else {
            double discountValue = coupon.getDiscountValue() > 0 ? coupon.getDiscountValue() : coupon.getDiscountPercentage();
            discountAmount = (subtotalSellingPrice * discountValue) / 100.0;
        }

        if (coupon.getMaxDiscount() != null && coupon.getMaxDiscount() > 0) {
            discountAmount = Math.min(discountAmount, coupon.getMaxDiscount());
        }

        discountAmount = Math.min(discountAmount, subtotalSellingPrice);
        return roundCurrency(discountAmount);
    }

    private double roundCurrency(double value) {
        return Math.round(value * 100.0) / 100.0;
    }
}






