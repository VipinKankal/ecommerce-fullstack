package com.example.ecommerce.order.controller;

import com.example.ecommerce.modal.Product;
import com.example.ecommerce.modal.User;
import com.example.ecommerce.modal.Wishlist;
import com.example.ecommerce.order.response.WishlistProductResponse;
import com.example.ecommerce.order.response.WishlistResponse;
import com.example.ecommerce.catalog.service.ProductService;
import com.example.ecommerce.user.service.UserService;
import com.example.ecommerce.order.service.WishlistService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/wishlist")
@PreAuthorize("hasAnyRole('CUSTOMER','ADMIN')")
public class WishlistController {

    private final WishlistService wishlistService;
    private final UserService userService;
    private final ProductService productService;

    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<WishlistResponse> getWishlistByUserId(
            @RequestHeader("Authorization") String jwt
    ) throws Exception {
        User user = userService.findUserByJwtToken(jwt);
        Wishlist wishlist = wishlistService.getWishlistByUserId(user);
        return ResponseEntity.ok(toResponse(wishlist));
    }

    @PostMapping("/add-product/{productId}")
    @Transactional
    public ResponseEntity<WishlistResponse> addProductToWishlist(
            @PathVariable Long productId,
            @RequestHeader("Authorization") String jwt
    ) throws Exception {
        Product product = productService.findProductById(productId);
        User user = userService.findUserByJwtToken(jwt);
        Wishlist updatedWishlist = wishlistService.addProductToWishlist(user, product);
        return ResponseEntity.ok(toResponse(updatedWishlist));
    }

    @DeleteMapping("/product/{productId}")
    @Transactional
    public ResponseEntity<WishlistResponse> removeProductFromWishlist(
            @PathVariable Long productId,
            @RequestHeader("Authorization") String jwt
    ) throws Exception {
        Product product = productService.findProductById(productId);
        User user = userService.findUserByJwtToken(jwt);
        Wishlist updatedWishlist = wishlistService.removeProductFromWishlist(user, product);
        return ResponseEntity.ok(toResponse(updatedWishlist));
    }

    private WishlistResponse toResponse(Wishlist wishlist) {
        WishlistResponse response = new WishlistResponse();
        response.setId(wishlist.getId());
        response.setUserId(wishlist.getUser() != null ? wishlist.getUser().getId() : null);

        List<WishlistProductResponse> products = new ArrayList<>();
        for (Product product : wishlist.getProducts()) {
            WishlistProductResponse productResponse = new WishlistProductResponse();
            productResponse.setId(product.getId());
            productResponse.setTitle(product.getTitle());
            productResponse.setDescription(product.getDescription());
            productResponse.setMrpPrice(product.getMrpPrice());
            productResponse.setSellingPrice(product.getSellingPrice());
            productResponse.setDiscountPercentage(product.getDiscountPercentage());
            productResponse.setColor(product.getColor());
            productResponse.setSize(product.getSize());
            productResponse.setQuantity(product.getQuantity());
            productResponse.setNumRatings(product.getNumRatings());
            if (product.getCategory() != null) {
                productResponse.setCategoryId(product.getCategory().getCategoryId());
                productResponse.setCategoryName(product.getCategory().getName());
            }
            productResponse.setImages(new ArrayList<>(product.getImages()));
            products.add(productResponse);
        }
        response.setProducts(products);
        return response;
    }
}




