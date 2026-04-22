package com.codecollab.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "voice_permissions", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"room_id", "user_id"})
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VoicePermission {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", referencedColumnName = "id")
    private Room room;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", referencedColumnName = "id")
    private User user;

    @Column(name = "is_muted")
    private Boolean isMuted;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "muted_by", referencedColumnName = "id")
    private User mutedBy;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (isMuted == null) {
            isMuted = false;
        }
        if (updatedAt == null) {
            updatedAt = LocalDateTime.now();
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
