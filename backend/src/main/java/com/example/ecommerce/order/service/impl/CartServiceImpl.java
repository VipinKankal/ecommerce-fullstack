package com.example.ecommerce.order.service.impl;

import com.example.ecommerce.modal.Cart;
import com.example.ecommerce.modal.CartItem;
import com.example.ecommerce.modal.Product;
import com.example.ecommerce.modal.ProductVariant;
import com.example.ecommerce.modal.User;
import com.example.ecommerce.repository.CartItemRepository;
import com.example.ecommerce.repository.CartRepository;
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
        int totalDiscountPrice = 0;
        int totalItems = 0;
 
        for (CartItem cartItem : cart.getCartItems()) {
            // Ensure nested product media is initialized before JSON serialization.
            if (cartItem.getProduct() != null && cartItem.getProduct().getImages() != null) {
                cartItem.getProduct().getImages().size();
            }

            int mrp = cartItem.getMrpPrice() != null ? cartItem.getMrpPrice() : 0;
            int selling = cartItem.getSellingPrice() != null ? cartItem.getSellingPrice() : 0;

            totalPrice += mrp;
            totalDiscountPrice += selling;
            totalItems += cartItem.getQuantity();
        }

        cart.setTotalMrpPrice(totalPrice);
        cart.setTotalItems(totalItems);
        cart.setTotalSellingPrice(totalDiscountPrice);
        cart.setDiscount(calculateDiscountPercentage(totalPrice,totalDiscountPrice));
        cart.setTotalItems(totalItems);
        return cart;
    }



    private int calculateDiscountPercentage(int mrpPrice, int sellingPrice) {
        if (mrpPrice<=0){
            return 0;
        }
        double discount = mrpPrice-sellingPrice;
        double discountPercentage = (discount / mrpPrice) * 100;
        return (int)discountPercentage;
    }
}






