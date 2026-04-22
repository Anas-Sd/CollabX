package com.codecollab.service;

import com.codecollab.dto.request.HistoryRequest;
import com.codecollab.model.CodeHistory;
import com.codecollab.model.Room;
import com.codecollab.model.User;
import com.codecollab.repository.CodeHistoryRepository;
import com.codecollab.repository.RoomRepository;
import com.codecollab.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class HistoryService {

    private final CodeHistoryRepository codeHistoryRepository;
    private final RoomRepository roomRepository;
    private final UserRepository userRepository;

    public List<CodeHistory> getHistory(String roomId) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Room not found"));
        return codeHistoryRepository.findByRoomOrderBySavedAtDesc(room);
    }

    public CodeHistory saveHistory(String roomId, String userEmail, HistoryRequest request) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Room not found"));
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!"PRO".equals(room.getHost().getSubscriptionType())) {
            long count = codeHistoryRepository.countByRoom(room);
            if (count >= 10) {
                throw new RuntimeException("FREE tier limit reached (10 snapshots max per room). Upgrade to PRO.");
            }
        }

        CodeHistory history = CodeHistory.builder()
                .room(room)
                .user(user)
                .codeSnapshot(request.getCode())
                .language(request.getLanguage())
                .savedAt(LocalDateTime.now())
                .build();

        return codeHistoryRepository.save(history);
    }
}
