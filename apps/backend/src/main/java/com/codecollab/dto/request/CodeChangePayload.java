package com.codecollab.dto.request;

import lombok.Data;

@Data
public class CodeChangePayload {
    private String userId;
    private String code;
    private String language;
    private Position cursorPosition;

    @Data
    public static class Position {
        private int line;
        private int column;
    }
}
