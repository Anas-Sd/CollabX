package com.codecollab.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "rooms")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Room {

    @Id
    @Column(length = 8)
    private String id;

    @Column(length = 100)
    private String name;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "host_id", referencedColumnName = "id")
    private User host;

    @Column(name = "is_active")
    private Boolean isActive;

    @Column(name = "max_members")
    private Integer maxMembers;

    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "current_code", columnDefinition = "TEXT")
    private String currentCode;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @PrePersist
    protected void onCreate() {
        if (isActive == null) {
            isActive = true;
        }
        if (maxMembers == null) {
            maxMembers = 5;
        }
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
