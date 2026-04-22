package com.codecollab.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "code_history")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CodeHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", referencedColumnName = "id")
    private Room room;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", referencedColumnName = "id")
    private User user;

    @Column(name = "code_snapshot", columnDefinition = "TEXT")
    private String codeSnapshot;

    @Column(length = 20)
    private String language;

    @Column(name = "saved_at")
    private LocalDateTime savedAt;

    @PrePersist
    protected void onCreate() {
        if (savedAt == null) {
            savedAt = LocalDateTime.now();
        }
    }
}
