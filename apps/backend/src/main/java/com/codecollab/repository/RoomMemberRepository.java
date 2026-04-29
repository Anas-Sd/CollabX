package com.codecollab.repository;

import com.codecollab.model.Room;
import com.codecollab.model.RoomMember;
import com.codecollab.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RoomMemberRepository extends JpaRepository<RoomMember, UUID> {
    Optional<RoomMember> findByRoomAndUser(Room room, User user);
    List<RoomMember> findByRoom(Room room);
    List<RoomMember> findByUser(User user);
    void deleteByRoomAndUser(Room room, User user);
    void deleteByRoom(Room room);
}
