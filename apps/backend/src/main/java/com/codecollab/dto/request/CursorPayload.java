package com.codecollab.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CursorPayload {
    private String roomId;
    private UUID userId;
    private String userName;
    private int lineNumber;
    private int column;
}
