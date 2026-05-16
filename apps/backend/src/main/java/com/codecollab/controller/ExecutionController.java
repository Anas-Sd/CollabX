package com.codecollab.controller;

import com.codecollab.dto.request.ExecuteRequest;
import com.codecollab.dto.request.SubmitCodeRequest;
import com.codecollab.dto.response.ExecutionResult;
import com.codecollab.dto.response.SubmitCodeResponse;
import com.codecollab.service.ExecutionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class ExecutionController {

    private final ExecutionService executionService;

    // Run code
    @PostMapping("/execute")
    public ResponseEntity<ExecutionResult> executeCode(
            @Valid @RequestBody ExecuteRequest request,
            Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(executionService.executeCode(email, request.getCode(), request.getLanguage(), request.getStdin(), request.getRoomId()));
    }

    // Submit code against test cases
    @PostMapping("/submit")
    public ResponseEntity<SubmitCodeResponse> submitCode(
            @Valid @RequestBody SubmitCodeRequest request,
            Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(executionService.submitCode(email, request));
    }
}
