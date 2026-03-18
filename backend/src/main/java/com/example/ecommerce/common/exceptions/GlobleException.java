package com.example.ecommerce.common.exceptions;

import com.razorpay.RazorpayException;
import com.stripe.exception.StripeException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.context.request.WebRequest;

import java.time.LocalDateTime;

@ControllerAdvice
public class GlobleException {

    private ResponseEntity<ErrorDetails> buildErrorResponse(Exception ex, WebRequest request, HttpStatus status) {
        ErrorDetails errorDetails = new ErrorDetails();
        errorDetails.setError(ex.getMessage());
        errorDetails.setDetails(request.getDescription(false));
        errorDetails.setTimestamp(LocalDateTime.now());
        return new ResponseEntity<>(errorDetails, status);
    }

    @ExceptionHandler(SellerException.class)
    public ResponseEntity<ErrorDetails> sellerExceptionHandler(SellerException se, WebRequest request){
        return buildErrorResponse(se, request, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(ProductException.class)
    public ResponseEntity<ErrorDetails> productExceptionHandler(ProductException pe, WebRequest request){
        return buildErrorResponse(pe, request, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<ErrorDetails> userNotFoundExceptionHandler(UserNotFoundException ue, WebRequest request){
        return buildErrorResponse(ue, request, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorDetails> validationExceptionHandler(MethodArgumentNotValidException ex, WebRequest request){
        return buildErrorResponse(ex, request, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorDetails> illegalArgumentExceptionHandler(IllegalArgumentException ex, WebRequest request){
        return buildErrorResponse(ex, request, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(RazorpayException.class)
    public ResponseEntity<ErrorDetails> razorpayExceptionHandler(RazorpayException ex, WebRequest request){
        String message = ex.getMessage() == null ? "Payment gateway error" : ex.getMessage();
        if (message.toLowerCase().contains("authentication failed")) {
            message = "Razorpay authentication failed. Check RAZORPAY_API_KEY and RAZORPAY_API_SECRET.";
        }
        return buildErrorResponse(new Exception(message), request, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(StripeException.class)
    public ResponseEntity<ErrorDetails> stripeExceptionHandler(StripeException ex, WebRequest request){
        String message = ex.getMessage() == null ? "Payment gateway error" : ex.getMessage();
        return buildErrorResponse(new Exception(message), request, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ErrorDetails> badCredentialsExceptionHandler(BadCredentialsException ex, WebRequest request){
        return buildErrorResponse(ex, request, HttpStatus.UNAUTHORIZED);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorDetails> accessDeniedExceptionHandler(AccessDeniedException ex, WebRequest request){
        return buildErrorResponse(ex, request, HttpStatus.FORBIDDEN);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorDetails> genericExceptionHandler(Exception ex, WebRequest request){
        String message = ex.getMessage() == null ? "" : ex.getMessage().trim();
        String normalized = message.toLowerCase();

        // Preserve user-facing validation/business errors instead of masking them as 500.
        if (normalized.contains("otp")
                || normalized.contains("email already in use")
                || normalized.contains("new email must be different")
                || normalized.contains("maximum otp attempts")
                || normalized.contains("too many otp")
                || normalized.contains("invalid otp")
                || normalized.contains("wrong otp")
                || normalized.contains("otp expired")
                || normalized.contains("otp already used")) {
            return buildErrorResponse(new Exception(message.isBlank() ? "Invalid request" : message), request, HttpStatus.BAD_REQUEST);
        }

        ErrorDetails errorDetails = new ErrorDetails();
        errorDetails.setError("Internal server error");
        errorDetails.setDetails(request.getDescription(false));
        errorDetails.setTimestamp(LocalDateTime.now());
        return new ResponseEntity<>(errorDetails, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}




