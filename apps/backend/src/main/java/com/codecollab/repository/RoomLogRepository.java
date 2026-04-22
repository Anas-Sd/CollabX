package com.codecollab.repository;

import com.codecollab.model.Room;
import com.codecollab.model.RoomLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RoomLogRepository extends JpaRepository<RoomLog, String> {
    List<RoomLog> findByRoomOrderByCreatedAtAsc(Room room);
}
