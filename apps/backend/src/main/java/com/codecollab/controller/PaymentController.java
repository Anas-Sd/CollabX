package com.codecollab.controller;

import com.codecollab.dto.request.CreateOrderRequest;
import com.codecollab.dto.request.VerifyPaymentRequest;
import com.codecollab.service.PaymentService;
import com.razorpay.RazorpayException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/create-order")
    public ResponseEntity<?> createOrder(@Valid @RequestBody CreateOrderRequest request, Authentication authentication) {
        try {
            String email = authentication.getName();
            return ResponseEntity.ok(paymentService.createOrder(email, request).toString());
        } catch (RazorpayException | RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/verify")
    public ResponseEntity<?> verifyPayment(@Valid @RequestBody VerifyPaymentRequest request, Authentication authentication) {
        String email = authentication.getName();
        boolean verified = paymentService.verifySignature(email, request);
        return ResponseEntity.ok(Map.of("success", verified));
    }
}
