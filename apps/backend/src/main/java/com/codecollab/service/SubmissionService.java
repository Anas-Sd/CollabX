package com.codecollab.service;

import com.codecollab.dto.request.SubmissionRequest;
import com.codecollab.dto.response.SubmissionResponse;
import com.codecollab.model.Room;
import com.codecollab.model.Submission;
import com.codecollab.model.User;
import com.codecollab.repository.RoomRepository;
import com.codecollab.repository.SubmissionRepository;
import com.codecollab.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SubmissionService {

    private final SubmissionRepository submissionRepository;
    private final RoomRepository roomRepository;
    private final UserRepository userRepository;

    // Save submission result
    public SubmissionResponse saveSubmission(String roomId, String email, SubmissionRequest request) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Room not found"));
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Submission submission = Submission.builder()
                .room(room)
                .user(user)
                .code(request.getCode())
                .language(request.getLanguage())
                .output(request.getOutput())
                .status(request.getStatus())
                .build();

        submission = submissionRepository.save(submission);
        return mapToResponse(submission);
    }

    // Get all room submissions
    public List<SubmissionResponse> getRoomSubmissions(String roomId) {
        return submissionRepository.findByRoomIdOrderByExecutedAtDesc(roomId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // Map to response DTO
    private SubmissionResponse mapToResponse(Submission sub) {
        return SubmissionResponse.builder()
                .id(sub.getId())
                .roomId(sub.getRoom().getId())
                .userName(sub.getUser().getName())
                .language(sub.getLanguage())
                .output(sub.getOutput())
                .status(sub.getStatus())
                .executedAt(sub.getExecutedAt())
                .build();
    }
}
