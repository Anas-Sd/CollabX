package com.codecollab.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class VoiceMuteRequest {
    @NotNull
    private Boolean isMuted;
}
