package com.codecollab.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TestResultResponse {
    private String input;
    private String expectedOutput;
    private String actualOutput;
    private boolean passed;
    private long executionTimeMs;
}
