package com.codecollab.repository;

import com.codecollab.model.CodeHistory;
import com.codecollab.model.Room;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CodeHistoryRepository extends JpaRepository<CodeHistory, UUID> {
    List<CodeHistory> findByRoomOrderBySavedAtDesc(Room room);
    long countByRoom(Room room);
    void deleteByRoom(Room room);
}
