package com.codecollab.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "submissions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Submission {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", referencedColumnName = "id")
    private Room room;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", referencedColumnName = "id")
    private User user;

    @Column(name = "user_name", length = 100)
    private String userName;

    @Column(columnDefinition = "TEXT")
    private String code;

    @Column(length = 20)
    private String language;

    @Column(columnDefinition = "TEXT")
    private String output;

    @Column(length = 20)
    private String status;

    @Column(name = "executed_at")
    private LocalDateTime executedAt;

    @Column(name = "execution_time_ms")
    private Long executionTimeMs;

    @Column(name = "test_cases_run")
    private Integer testCasesRun;

    @Column(name = "test_cases_passed")
    private Integer testCasesPassed;

    @PrePersist
    protected void onCreate() {
        if (executedAt == null) {
            executedAt = LocalDateTime.now();
        }
    }
}
