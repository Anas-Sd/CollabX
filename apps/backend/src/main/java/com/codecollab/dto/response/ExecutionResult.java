package com.codecollab.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExecutionResult {
    private String output;
    private String error;
    private int exitCode;
    private long executionTimeMs;
    private boolean compilationError;
}
