package com.example.ecommerce.order.controller;

import com.example.ecommerce.common.exceptions.ProductException;
import com.example.ecommerce.modal.Cart;
import com.example.ecommerce.modal.CartItem;
import com.example.ecommerce.modal.Product;
import com.example.ecommerce.modal.User;
import com.example.ecommerce.order.request.AddItemRequest;
import com.example.ecommerce.order.request.UpdateCartItemRequest;
import com.example.ecommerce.order.service.CartItemService;
import com.example.ecommerce.order.service.CartService;
import com.example.ecommerce.catalog.service.ProductService;
import com.example.ecommerce.user.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/cart")
@PreAuthorize("hasAnyRole('CUSTOMER','ADMIN')")
public class CartController {

    private final CartService cartService;
    private final CartItemService cartItemService;
    private final UserService userService;
    private final ProductService productService;

    @GetMapping
    public ResponseEntity<Cart> findUserCartHandler(
            @RequestHeader("Authorization") String jwt
    ) throws Exception {
        User user = userService.findUserByJwtToken(jwt);
        Cart cart = cartService.findUserCart(user);
        return new ResponseEntity<>(cart, HttpStatus.OK);
    }

    @PutMapping("/add")
    public ResponseEntity<Cart> addItemToCart(
            @Valid @RequestBody AddItemRequest request,
            @RequestHeader("Authorization") String jwt
    ) throws ProductException, Exception {

        User user = userService.findUserByJwtToken(jwt);
        Product product = productService.findProductById(request.getProductId());

        cartService.addItemToCart(
                user,
                product,
                request.getSize(),
                request.getQuantity()
        );

        Cart cart = cartService.findUserCart(user);
        return new ResponseEntity<>(cart, HttpStatus.CREATED);
    }

    @DeleteMapping("/item/{cartItemId}")
    public ResponseEntity<Cart> deleteCartItemHandler(
            @RequestHeader("Authorization") String jwt,
            @PathVariable Long cartItemId
    ) throws Exception {

        User user = userService.findUserByJwtToken(jwt);
        cartItemService.removeCartItem(user.getId(), cartItemId);
        Cart cart = cartService.findUserCart(user);
        return new ResponseEntity<>(cart, HttpStatus.OK);

    }

    @PutMapping("/item/{cartItemId}")
    public ResponseEntity<Cart> updateCartItem(
            @RequestHeader("Authorization") String jwt,
            @PathVariable Long cartItemId,
            @Valid @RequestBody UpdateCartItemRequest request
    ) throws Exception {

        User user = userService.findUserByJwtToken(jwt);

        CartItem cartItem = new CartItem();
        cartItem.setQuantity(request.getQuantity());
        cartItem.setSize(request.getSize());
        cartItemService.updateCartItem(user.getId(), cartItemId, cartItem);
        Cart cart = cartService.findUserCart(user);

        return ResponseEntity.ok(cart);
    }
}




