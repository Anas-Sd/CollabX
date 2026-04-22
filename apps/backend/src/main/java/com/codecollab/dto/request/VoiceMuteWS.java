package com.codecollab.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VoiceMuteWS {
    private String targetUserId;
    private Boolean isMuted;
}
