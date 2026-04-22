package com.codecollab.controller;

import com.codecollab.dto.request.HistoryRequest;
import com.codecollab.model.CodeHistory;
import com.codecollab.service.HistoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/rooms/{roomId}/history")
@RequiredArgsConstructor
public class HistoryController {

    private final HistoryService historyService;

    @GetMapping
    public ResponseEntity<List<CodeHistory>> getHistory(@PathVariable String roomId) {
        return ResponseEntity.ok(historyService.getHistory(roomId));
    }

    @PostMapping
    public ResponseEntity<CodeHistory> saveHistory(@PathVariable String roomId, @RequestBody HistoryRequest request, Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(historyService.saveHistory(roomId, email, request));
    }
}
