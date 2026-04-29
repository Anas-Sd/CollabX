package com.codecollab.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "users")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, unique = true, length = 255)
    private String email;

    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Column(name = "subscription_type", length = 20)
    private String subscriptionType;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "subscription_expires_at")
    private LocalDateTime subscriptionExpiresAt;
    
    @PrePersist
    protected void onCreate() {
        if (subscriptionType == null) {
            subscriptionType = "FREE";
        }
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
