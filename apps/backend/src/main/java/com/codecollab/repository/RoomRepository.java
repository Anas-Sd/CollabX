package com.codecollab.repository;

import com.codecollab.model.Room;
import com.codecollab.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RoomRepository extends JpaRepository<Room, String> {
    Optional<Room> findByIdAndIsActiveTrue(String id);
    List<Room> findByHost(User host);
    List<Room> findByIsActiveTrueAndExpiresAtBefore(java.time.LocalDateTime time);
}
