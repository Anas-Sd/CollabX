package com.codecollab.controller;

import com.codecollab.dto.request.CreateRoomRequest;
import com.codecollab.dto.response.RoomResponse;
import com.codecollab.service.RoomService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/rooms")
@RequiredArgsConstructor
public class RoomController {

    private final RoomService roomService;

    @PostMapping
    public ResponseEntity<RoomResponse> createRoom(
            @Valid @RequestBody CreateRoomRequest request, 
            Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(roomService.createRoom(request, email));
    }

    @GetMapping("/{roomId}")
    public ResponseEntity<RoomResponse> getRoom(@PathVariable String roomId) {
        return ResponseEntity.ok(roomService.getRoomStatus(roomId));
    }

    @PostMapping("/{roomId}/join")
    public ResponseEntity<RoomResponse> joinRoom(
            @PathVariable String roomId, 
            @RequestBody(required = false) com.codecollab.dto.request.JoinRoomRequest joinRequest,
            Authentication authentication) {
        String email = authentication.getName();
        String requestedRole = (joinRequest != null && joinRequest.getRole() != null) ? joinRequest.getRole() : "VIEWER";
        return ResponseEntity.ok(roomService.joinRoom(roomId, email, requestedRole));
    }

    @DeleteMapping("/{roomId}/leave")
    public ResponseEntity<Void> leaveRoom(
            @PathVariable String roomId, 
            Authentication authentication) {
        String email = authentication.getName();
        roomService.leaveRoom(roomId, email);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{roomId}/end")
    public ResponseEntity<Void> endRoom(@PathVariable String roomId, Authentication authentication) {
        roomService.endRoom(roomId, authentication.getName());
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{roomId}/history")
    public ResponseEntity<Void> deleteHistory(@PathVariable String roomId, Authentication authentication) {
        roomService.deleteRoomHistory(roomId, authentication.getName());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{roomId}/extend")
    public ResponseEntity<Void> extendTime(@PathVariable String roomId, @RequestParam(defaultValue = "30") int extraMinutes, Authentication authentication) {
        roomService.extendTime(roomId, authentication.getName(), extraMinutes);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/my")
    public ResponseEntity<List<RoomResponse>> getMyRooms(Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(roomService.getMyRooms(email));
    }

    @PutMapping("/{roomId}/members/{userId}/role")
    public ResponseEntity<Void> updateRole(@PathVariable String roomId, @PathVariable String userId, @Valid @RequestBody com.codecollab.dto.request.RoleUpdateRequest request, Authentication authentication) {
        roomService.updateRole(roomId, userId, request.getRole(), authentication.getName());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{roomId}/members/{userId}/kick")
    public ResponseEntity<Void> kickMember(@PathVariable String roomId, @PathVariable String userId, Authentication authentication) {
        roomService.kickMember(roomId, userId, authentication.getName());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{roomId}/transfer-host")
    public ResponseEntity<Void> transferHost(@PathVariable String roomId, @Valid @RequestBody com.codecollab.dto.request.TransferHostRequest request, Authentication authentication) {
        roomService.transferHost(roomId, request.getNewHostId(), authentication.getName());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{roomId}/voice/{userId}/mute")
    public ResponseEntity<Void> muteUser(@PathVariable String roomId, @PathVariable String userId, Authentication authentication) {
        roomService.updateVoicePermission(roomId, userId, true, authentication.getName());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{roomId}/voice/{userId}/unmute")
    public ResponseEntity<Void> unmuteUser(@PathVariable String roomId, @PathVariable String userId, Authentication authentication) {
        roomService.updateVoicePermission(roomId, userId, false, authentication.getName());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{roomId}/voice")
    public ResponseEntity<List<com.codecollab.dto.response.VoicePermissionResponse>> getVoicePermissions(@PathVariable String roomId) {
        return ResponseEntity.ok(roomService.getVoicePermissions(roomId));
    }

    @PostMapping("/{roomId}/waitlist/{userId}/accept")
    public ResponseEntity<Void> acceptWaitlist(@PathVariable String roomId, @PathVariable String userId, Authentication authentication) {
        roomService.processWaitlist(roomId, userId, authentication.getName(), true);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{roomId}/waitlist/{userId}/reject")
    public ResponseEntity<Void> rejectWaitlist(@PathVariable String roomId, @PathVariable String userId, Authentication authentication) {
        roomService.processWaitlist(roomId, userId, authentication.getName(), false);
        return ResponseEntity.ok().build();
    }
}
