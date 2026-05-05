package com.codecollab.repository;

import com.codecollab.model.Room;
import com.codecollab.model.User;
import com.codecollab.model.VoicePermission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface VoicePermissionRepository extends JpaRepository<VoicePermission, UUID> {
    Optional<VoicePermission> findByRoomAndUser(Room room, User user);
    List<VoicePermission> findByRoom(Room room);
    void deleteByRoom(Room room);
    void deleteByUser(User user);
}
