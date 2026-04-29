package com.codecollab.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class RoomMemberResponse {
    private String id; // user ID
    private String name;
    private String role;
    private String status;
    private LocalDateTime joinedAt;
    private String subscriptionType;
}
