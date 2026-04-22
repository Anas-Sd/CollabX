package com.codecollab.dto.response;

import lombok.Builder;
import lombok.Data;
import java.util.UUID;

@Data
@Builder
public class VoicePermissionResponse {
    private String userId;
    private Boolean isMuted;
}
