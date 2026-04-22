package com.codecollab.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class UserDto {
    private UUID id;
    private String name;
    private String email;
    private String subscriptionType;
    private LocalDateTime createdAt;
}
