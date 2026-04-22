package com.codecollab.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatPayload {
    private String roomId;
    private UUID userId;
    private String userName;
    private String message;
    private LocalDateTime timestamp;
}
