package com.codecollab.service;

import com.codecollab.dto.request.CreateOrderRequest;
import com.codecollab.dto.request.VerifyPaymentRequest;
import com.codecollab.model.Payment;
import com.codecollab.model.User;
import com.codecollab.repository.PaymentRepository;
import com.codecollab.repository.UserRepository;
import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import com.razorpay.Utils;
import lombok.RequiredArgsConstructor;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final UserRepository userRepository;
    private final PaymentRepository paymentRepository;

    @Value("${razorpay.key.id:}")
    private String razorpayKeyId;

    @Value("${razorpay.key.secret:}")
    private String razorpayKeySecret;

    public Order createOrder(String userEmail, CreateOrderRequest request) throws RazorpayException {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if ("PRO".equals(user.getSubscriptionType())) {
            throw new RuntimeException("User already has PRO subscription");
        }

        RazorpayClient razorpay = new RazorpayClient(razorpayKeyId, razorpayKeySecret);

        JSONObject orderRequest = new JSONObject();
        orderRequest.put("amount", request.getAmount());
        orderRequest.put("currency", request.getCurrency() != null ? request.getCurrency() : "INR");
        orderRequest.put("receipt", "txn_" + System.currentTimeMillis());

        Order order = razorpay.orders.create(orderRequest);

        Payment payment = Payment.builder()
                .user(user)
                .razorpayOrderId(order.get("id"))
                .amount(request.getAmount())
                .currency(request.getCurrency())
                .status("CREATED")
                .createdAt(LocalDateTime.now())
                .build();

        paymentRepository.save(payment);

        return order;
    }

    public boolean verifySignature(String userEmail, VerifyPaymentRequest request) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Payment payment = paymentRepository.findByRazorpayOrderId(request.getRazorpayOrderId());
        if (payment == null) {
            throw new RuntimeException("Payment record not found");
        }

        try {
            JSONObject options = new JSONObject();
            options.put("razorpay_order_id", request.getRazorpayOrderId());
            options.put("razorpay_payment_id", request.getRazorpayPaymentId());
            options.put("razorpay_signature", request.getRazorpaySignature());

            boolean isVerified = Utils.verifyPaymentSignature(options, razorpayKeySecret);

            if (isVerified) {
                payment.setStatus("VERIFIED");
                payment.setRazorpayPaymentId(request.getRazorpayPaymentId());
                payment.setRazorpaySignature(request.getRazorpaySignature());
                paymentRepository.save(payment);

                user.setSubscriptionType("PRO");
                user.setSubscriptionExpiresAt(LocalDateTime.now().plusMinutes(43200));
                userRepository.save(user);
                return true;
            } else {
                payment.setStatus("FAILED");
                paymentRepository.save(payment);
                return false;
            }
        } catch (RazorpayException e) {
            throw new RuntimeException("Razorpay exception during signature verification", e);
        }
    }

    public void cancelSubscription(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setSubscriptionType("FREE");
        user.setSubscriptionExpiresAt(null);
        userRepository.save(user);
    }
}
