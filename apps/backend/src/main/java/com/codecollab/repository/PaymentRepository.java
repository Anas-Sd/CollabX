package com.codecollab.repository;

import com.codecollab.model.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, UUID> {
    Payment findByRazorpayOrderId(String orderId);
}
