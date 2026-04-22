package com.codecollab.repository;

import com.codecollab.model.Room;
import com.codecollab.model.RoomCodeCache;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RoomCodeCacheRepository extends JpaRepository<RoomCodeCache, UUID> {
    Optional<RoomCodeCache> findByRoomAndLanguage(Room room, String language);
    List<RoomCodeCache> findByRoom(Room room);
    void deleteByRoom(Room room);
}
