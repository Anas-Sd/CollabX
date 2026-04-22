package com.codecollab.execution;

import com.codecollab.dto.response.ExecutionResult;
import java.io.IOException;

public interface CodeExecutor {
    ExecutionResult execute(String code, String stdin) throws IOException, InterruptedException;
    
    default ExecutionResult timeoutResult() {
        return ExecutionResult.builder()
                .output("")
                .error("Execution Timed Out (Hit 10s limit)")
                .exitCode(143)
                .executionTimeMs(10000)
                .build();
    }

    default ExecutionResult errorResult(String error) {
        return ExecutionResult.builder()
                .output("")
                .error(error)
                .exitCode(1)
                .executionTimeMs(0)
                .build();
    }
}
