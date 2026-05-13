package com.codecollab.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CursorPayload {
    private String roomId;
    private String userId;
    private String userName;
    private int line;
    private int column;
    private String color;
}
