package com.codecollab.repository;

import com.codecollab.model.Room;
import com.codecollab.model.RoomTestCase;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface RoomTestCaseRepository extends JpaRepository<RoomTestCase, UUID> {
    List<RoomTestCase> findByRoomOrderByCreatedAtAsc(Room room);
    void deleteByRoom(Room room);
}
