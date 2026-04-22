package com.codecollab.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubmissionResponse {
    private UUID id;
    private String roomId;
    private String userName;
    private String language;
    private String output;
    private String status;
    private LocalDateTime executedAt;
}
