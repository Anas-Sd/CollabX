package com.codecollab.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateRoomRequest {
    @NotBlank(message = "Room name is required")
    private String name;
    
    private Integer durationMinutes;
    private Integer maxMembers;
}
