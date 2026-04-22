package com.codecollab.service;

import com.codecollab.model.Room;
import com.codecollab.repository.RoomRepository;
import lombok.RequiredArgsConstructor;
import com.codecollab.websocket.RoomSocketHandler;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import jakarta.transaction.Transactional;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RoomCleanupService {

    private final RoomRepository roomRepository;
    private final RoomSocketHandler roomSocketHandler;

    @Scheduled(fixedRate = 60000) // Runs every minute
    @Transactional
    public void cleanupExpiredRooms() {
        List<Room> expiredRooms = roomRepository.findByIsActiveTrueAndExpiresAtBefore(LocalDateTime.now());
        for (Room room : expiredRooms) {
            room.setIsActive(false);
            roomRepository.save(room);
            roomSocketHandler.broadcastToRoom(room.getId().toString(), "end", "ROOM_EXPIRED");
        }
    }
}
