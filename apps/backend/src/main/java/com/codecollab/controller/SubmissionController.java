package com.codecollab.controller;

import com.codecollab.dto.request.SubmissionRequest;
import com.codecollab.dto.response.SubmissionResponse;
import com.codecollab.service.SubmissionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/rooms/{roomId}/submissions")
@RequiredArgsConstructor
public class SubmissionController {

    private final SubmissionService submissionService;

    @PostMapping
    public ResponseEntity<SubmissionResponse> saveSubmission(
            @PathVariable String roomId,
            @Valid @RequestBody SubmissionRequest request,
            Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(submissionService.saveSubmission(roomId, email, request));
    }

    @GetMapping
    public ResponseEntity<List<SubmissionResponse>> getRoomSubmissions(
            @PathVariable String roomId) {
        return ResponseEntity.ok(submissionService.getRoomSubmissions(roomId));
    }
}
