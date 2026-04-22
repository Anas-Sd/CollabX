package com.codecollab.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class RoomLogResponse {
    private String id;
    private String userId;
    private String userName;
    private String action;
    private LocalDateTime timestamp;
}
