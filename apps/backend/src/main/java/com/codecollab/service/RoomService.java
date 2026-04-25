package com.codecollab.service;

import com.codecollab.dto.request.CreateRoomRequest;
import com.codecollab.dto.response.RoomMemberResponse;
import com.codecollab.dto.response.RoomResponse;
import com.codecollab.model.Room;
import com.codecollab.model.RoomMember;
import com.codecollab.model.User;
import com.codecollab.repository.RoomMemberRepository;
import com.codecollab.repository.RoomRepository;
import com.codecollab.repository.UserRepository;
import com.codecollab.repository.RoomChatRepository;
import com.codecollab.repository.RoomLogRepository;
import com.codecollab.repository.RoomTestCaseRepository;
import com.codecollab.repository.RoomCodeCacheRepository;
import com.codecollab.model.RoomChat;
import com.codecollab.model.RoomLog;
import com.codecollab.model.RoomTestCase;
import com.codecollab.model.RoomCodeCache;
import com.codecollab.dto.request.ChatPayload;
import com.codecollab.dto.response.RoomLogResponse;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import com.codecollab.websocket.RoomSocketHandler;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.security.SecureRandom;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RoomService {

    private final RoomRepository roomRepository;
    private final RoomMemberRepository roomMemberRepository;
    private final UserRepository userRepository;
    private final RoomChatRepository roomChatRepository;
    private final RoomLogRepository roomLogRepository;
    private final RoomTestCaseRepository roomTestCaseRepository;
    private final RoomCodeCacheRepository roomCodeCacheRepository;
    private final com.codecollab.repository.VoicePermissionRepository voicePermissionRepository;
    private final RoomSocketHandler roomSocketHandler;

    private static final String CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static final int ROOM_ID_LENGTH = 8;
    private final SecureRandom random = new SecureRandom();

    public void logActivity(Room room, User user, String action) {
        RoomLog log = RoomLog.builder()
                .room(room)
                .user(user)
                .action(action)
                .build();
        roomLogRepository.save(log);
        
        RoomLogResponse res = RoomLogResponse.builder()
                .id(log.getId())
                .userId(user.getId().toString())
                .userName(user.getName())
                .action(action)
                .timestamp(java.time.LocalDateTime.now())
                .build();
        roomSocketHandler.broadcastToRoom(room.getId().toString(), "logs", res);
    }

    @Transactional
    public void logExecutionNative(String roomId, String userId, String type) {
        Room room = roomRepository.findById(roomId).orElseThrow();
        User user = userRepository.findById(java.util.UUID.fromString(userId)).orElseThrow();
        if ("RUN_START".equals(type)) {
            logActivity(room, user, "Ran the project environment debugger");
        } else if ("SUBMIT_END".equals(type)) {
            logActivity(room, user, "Submits syntax against Unit Tests");
        }
    }

    public String generateRoomId() {
        StringBuilder sb;
        String id;
        do {
            sb = new StringBuilder(ROOM_ID_LENGTH);
            for (int i = 0; i < ROOM_ID_LENGTH; i++) {
                sb.append(CHARACTERS.charAt(random.nextInt(CHARACTERS.length())));
            }
            id = sb.toString();
        } while (roomRepository.existsById(id));
        return id;
    }

    @Transactional
    public RoomResponse createRoom(CreateRoomRequest request, String userEmail) {
        User host = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        int baseLimit = request.getMaxMembers() != null ? request.getMaxMembers() : 5;
        int maxMembers = "PRO".equals(host.getSubscriptionType()) ? Math.min(baseLimit, 20) : Math.min(baseLimit, 5);

        java.time.LocalDateTime expiresAt = null;
        if (request.getDurationMinutes() != null && request.getDurationMinutes() > 0) {
            expiresAt = java.time.LocalDateTime.now().plusMinutes(request.getDurationMinutes());
        }

        Room room = Room.builder()
                .id(generateRoomId())
                .name(request.getName())
                .host(host)
                .maxMembers(maxMembers)
                .isActive(true)
                .expiresAt(expiresAt)
                .build();

        room = roomRepository.save(room);

        RoomMember member = RoomMember.builder()
                .room(room)
                .user(host)
                .role("HOST")
                .status("APPROVED")
                .build();

        roomMemberRepository.save(member);
        
        logActivity(room, host, "Room Created & Joined as Host");

        return mapToRoomResponse(room, List.of(member));
    }

    public RoomResponse getRoomStatus(String roomId) {
        Room room = roomRepository.findByIdAndIsActiveTrue(roomId)
                .orElseThrow(() -> new RuntimeException("Room not found or inactive"));

        if (room.getExpiresAt() != null && java.time.LocalDateTime.now().isAfter(room.getExpiresAt())) {
            room.setIsActive(false);
            roomRepository.save(room);
            throw new RuntimeException("Room session has expired");
        }

        List<RoomMember> members = roomMemberRepository.findByRoom(room);
        return mapToRoomResponse(room, members);
    }

    @Transactional
    public RoomResponse joinRoom(String roomId, String userEmail, String requestedRole) {
        Room room = roomRepository.findByIdAndIsActiveTrue(roomId)
                .orElseThrow(() -> new RuntimeException("Room not found or inactive"));

        if (room.getExpiresAt() != null && java.time.LocalDateTime.now().isAfter(room.getExpiresAt())) {
            room.setIsActive(false);
            roomRepository.save(room);
            throw new RuntimeException("Room session has expired");
        }

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<RoomMember> existingMembers = roomMemberRepository.findByRoom(room);

        java.util.Optional<RoomMember> existingOpt = existingMembers.stream()
                .filter(m -> m.getUser().getId().equals(user.getId()))
                .findFirst();

        if (existingOpt.isPresent()) {
            RoomMember exist = existingOpt.get();
            if ("LEFT".equals(exist.getStatus()) || "KICKED".equals(exist.getStatus()) || "REJECTED".equals(exist.getStatus())) {
                exist.setStatus("PENDING");
                exist.setRole("EDITOR".equalsIgnoreCase(requestedRole) ? "EDITOR" : "VIEWER");
                roomMemberRepository.save(exist);
                logActivity(room, user, "Requested to rejoin as " + ("EDITOR".equalsIgnoreCase(requestedRole) ? "EDITOR" : "VIEWER"));
                TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                    @Override
                    public void afterCommit() {
                        roomSocketHandler.broadcastToRoom(room.getId().toString(), "waitlist", "UPDATE");
                    }
                });
            }
        } else {
            long activeCount = existingMembers.stream()
                    .filter(m -> "APPROVED".equals(m.getStatus()) || "PENDING".equals(m.getStatus()) || "HOST".equals(m.getRole()))
                    .count();
            if (activeCount >= room.getMaxMembers()) {
                throw new RuntimeException("Room is full");
            }
            RoomMember newMember = RoomMember.builder()
                    .room(room)
                    .user(user)
                    .role("EDITOR".equalsIgnoreCase(requestedRole) ? "EDITOR" : "VIEWER")
                    .status("PENDING")
                    .build();
            roomMemberRepository.save(newMember);
            existingMembers.add(newMember);
            
            logActivity(room, user, "Requested to join as " + ("EDITOR".equalsIgnoreCase(requestedRole) ? "EDITOR" : "VIEWER"));
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    roomSocketHandler.broadcastToRoom(room.getId().toString(), "waitlist", "UPDATE");
                }
            });
        }

        return mapToRoomResponse(room, existingMembers);
    }

    @Transactional
    public void leaveRoom(String roomId, String userEmail) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Room not found"));
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        RoomMember member = roomMemberRepository.findByRoomAndUser(room, user)
                .orElseThrow(() -> new RuntimeException("Not in room"));
        
        member.setStatus("LEFT");
        roomMemberRepository.save(member);
        
        logActivity(room, user, "Left the room");
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                roomSocketHandler.broadcastToRoom(roomId, "members.leave", user.getId().toString());
            }
        });

        // Output room closure if host left (optional implementation)
        if (room.getHost().getId().equals(user.getId())) {
             room.setIsActive(false);
             roomRepository.save(room);
        }
    }

    @Transactional
    public void endRoom(String roomId, String requesterEmail) {
        Room room = roomRepository.findById(roomId).orElseThrow(() -> new RuntimeException("Room not found"));
        User requester = userRepository.findByEmail(requesterEmail).orElseThrow(() -> new RuntimeException("User not found"));
        
        if (!room.getHost().getId().equals(requester.getId())) {
            throw new RuntimeException("Only host can end room");
        }
        
        room.setIsActive(false);
        roomRepository.save(room);
        
        // Data Cleanup Strategy:
        // Free up PostgreSQL memory permanently once the room is marked dead.
        roomTestCaseRepository.deleteByRoom(room);
        roomCodeCacheRepository.deleteByRoom(room);
        
        logActivity(room, requester, "Permanently ended the Workspace");
        roomSocketHandler.broadcastToRoom(roomId, "end", "ROOM_ENDED_BY_HOST");

        // Clear associated SQL ephemeral Memory frame securely instantly to save server RAM 
        try (java.sql.Connection conn = java.sql.DriverManager.getConnection("jdbc:h2:mem:" + roomId.replaceAll("[^a-zA-Z0-9]", "_") + ";DB_CLOSE_DELAY=-1", "sa", "");
             java.sql.Statement stmt = conn.createStatement()) {
            stmt.execute("SHUTDOWN");
        } catch (Exception ignored) {
            // Memory frame likely didn't exist or already expired, perfectly fine to ignore
        }
    }

    public List<RoomResponse> getMyRooms(String userEmail) {
        User user = userRepository.findByEmail(userEmail).orElseThrow();
        List<RoomMember> memberships = roomMemberRepository.findByUser(user);
        
        return memberships.stream()
                .sorted((m1, m2) -> m2.getRoom().getCreatedAt().compareTo(m1.getRoom().getCreatedAt()))
                .limit(10)
                .map(m -> {
                    Room room = m.getRoom();
                    List<RoomMember> members = roomMemberRepository.findByRoom(room);
                    return mapToRoomResponse(room, members);
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public void updateRoomCodeCache(String roomId, String language, String sourceCode) {
        Room room = roomRepository.findById(roomId).orElseThrow();
        
        // Update general code tracking
        room.setCurrentCode(sourceCode);
        roomRepository.save(room);

        // Update DB Language specific cache
        RoomCodeCache cache = roomCodeCacheRepository.findByRoomAndLanguage(room, language)
                .orElse(RoomCodeCache.builder().room(room).language(language).build());
        cache.setSourceCode(sourceCode);
        roomCodeCacheRepository.save(cache);
    }

    @Transactional
    public void saveTestCase(String roomId, String input, String expectedOutput) {
        Room room = roomRepository.findById(roomId).orElseThrow();
        RoomTestCase testCase = RoomTestCase.builder()
                .room(room)
                .input(input)
                .expectedOutput(expectedOutput)
                .build();
        roomTestCaseRepository.save(testCase);
    }

    @Transactional
    public void removeTestCases(String roomId) {
        Room room = roomRepository.findById(roomId).orElseThrow();
        roomTestCaseRepository.deleteByRoom(room);
    }

    @Transactional
    public void extendTime(String roomId, String requesterEmail, int extraMinutes) {
        Room room = roomRepository.findById(roomId).orElseThrow();
        User requester = userRepository.findByEmail(requesterEmail).orElseThrow();
        if (!room.getHost().getId().equals(requester.getId())) {
             throw new RuntimeException("Only host can extend time");
        }
        // PRO Check Stripped for local integration overrides:
        // if (!"PRO".equals(requester.getSubscriptionType())) { ... }
        if (room.getExpiresAt() != null) {
             room.setExpiresAt(room.getExpiresAt().plusMinutes(extraMinutes));
             roomRepository.save(room);
             roomSocketHandler.broadcastToRoom(roomId, "time.extended", room.getExpiresAt().toString());
             logActivity(room, requester, "Extended Session Time by " + extraMinutes + " Minutes");
        }
    }

    @Transactional
    public void deleteRoomHistory(String roomId, String userEmail) {
        Room room = roomRepository.findById(roomId).orElseThrow();
        User user = userRepository.findByEmail(userEmail).orElseThrow();
        // Allow deleting only if room is inactive (Ended)
        if (room.getIsActive()) {
             throw new RuntimeException("Cannot delete history of an active room");
        }
        roomMemberRepository.deleteByRoomAndUser(room, user);
    }

    @Transactional
    public void updateRoomCode(String roomId, String newCode) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Room not found"));
        room.setCurrentCode(newCode);
        roomRepository.save(room);
    }

    @Transactional
    public void saveChat(String roomId, ChatPayload payload) {
        Room room = roomRepository.findById(roomId).orElseThrow();
        User user = userRepository.findById(payload.getUserId()).orElseThrow();
        
        RoomChat chat = RoomChat.builder()
                .room(room)
                .user(user)
                .message(payload.getMessage())
                .createdAt(payload.getTimestamp())
                .build();
                
        roomChatRepository.save(chat);
    }

    @Transactional
    public void updateRole(String roomId, String targetUserId, String newRole, String requesterEmail) {
        Room room = roomRepository.findById(roomId).orElseThrow();
        User requester = userRepository.findByEmail(requesterEmail).orElseThrow();
        
        if (!room.getHost().getId().equals(requester.getId())) {
            throw new RuntimeException("Only host can update roles");
        }
        
        User targetUser = userRepository.findById(java.util.UUID.fromString(targetUserId)).orElseThrow();
        RoomMember member = roomMemberRepository.findByRoomAndUser(room, targetUser)
                .orElseThrow(() -> new RuntimeException("Member not found"));
                
        member.setRole(newRole);
        roomMemberRepository.save(member);

        logActivity(room, requester, "Changed role of " + targetUser.getName() + " to " + newRole);

        com.codecollab.dto.request.RoleUpdateWS payload = new com.codecollab.dto.request.RoleUpdateWS();
        payload.setTargetUserId(targetUserId);
        payload.setRole(newRole);
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                roomSocketHandler.broadcastToRoom(roomId, "roles", payload);
            }
        });
    }

    @Transactional
    public void kickMember(String roomId, String targetUserId, String requesterEmail) {
        Room room = roomRepository.findById(roomId).orElseThrow();
        User requester = userRepository.findByEmail(requesterEmail).orElseThrow();
        
        if (!room.getHost().getId().equals(requester.getId())) {
            throw new RuntimeException("Only host can kick members");
        }
        
        User targetUser = userRepository.findById(java.util.UUID.fromString(targetUserId)).orElseThrow();
        RoomMember member = roomMemberRepository.findByRoomAndUser(room, targetUser)
                .orElseThrow(() -> new RuntimeException("Target user is not in the room"));
        
        member.setStatus("KICKED");
        roomMemberRepository.save(member);
        
        logActivity(room, requester, "Kicked " + targetUser.getName());
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                roomSocketHandler.broadcastToRoom(roomId, "kick", targetUserId);
            }
        });
    }

    @Transactional
    public void transferHost(String roomId, String newHostId, String requesterEmail) {
        Room room = roomRepository.findById(roomId).orElseThrow();
        User requester = userRepository.findByEmail(requesterEmail).orElseThrow();
        
        if (!room.getHost().getId().equals(requester.getId())) {
            throw new RuntimeException("Only host can transfer host");
        }
        
        User newHostUser = userRepository.findById(java.util.UUID.fromString(newHostId)).orElseThrow();
        RoomMember newHostMember = roomMemberRepository.findByRoomAndUser(room, newHostUser)
                .orElseThrow(() -> new RuntimeException("Target user is not in the room"));
                
        RoomMember currentHostMember = roomMemberRepository.findByRoomAndUser(room, requester)
                .orElseThrow(() -> new RuntimeException("Current host member record not found"));

        room.setHost(newHostUser);
        roomRepository.save(room);

        newHostMember.setRole("HOST");
        currentHostMember.setRole("EDITOR");
        roomMemberRepository.save(newHostMember);
        roomMemberRepository.save(currentHostMember);

        logActivity(room, requester, "Transferred Host to " + newHostUser.getName());

        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                roomSocketHandler.broadcastToRoom(roomId, "host_transfer", newHostId);
            }
        });
    }

    @Transactional
    public void updateVoicePermission(String roomId, String targetUserId, boolean isMuted, String requesterEmail) {
        Room room = roomRepository.findById(roomId).orElseThrow();
        User requester = userRepository.findByEmail(requesterEmail).orElseThrow();
        
        if (!room.getHost().getId().equals(requester.getId())) {
            throw new RuntimeException("Only host can modify voice permissions");
        }
        
        User targetUser = userRepository.findById(java.util.UUID.fromString(targetUserId)).orElseThrow();
        com.codecollab.model.VoicePermission permission = voicePermissionRepository.findByRoomAndUser(room, targetUser)
                .orElse(com.codecollab.model.VoicePermission.builder()
                        .room(room)
                        .user(targetUser)
                        .build());
                        
        permission.setIsMuted(isMuted);
        permission.setMutedBy(requester);
        voicePermissionRepository.save(permission);
        
        com.codecollab.dto.request.VoiceMuteWS payload = new com.codecollab.dto.request.VoiceMuteWS();
        payload.setTargetUserId(targetUserId);
        payload.setIsMuted(isMuted);
        roomSocketHandler.broadcastToRoom(roomId, "voice", payload);
    }

    @Transactional
    public void processWaitlist(String roomId, String userId, String requesterEmail, boolean accept) {
        Room room = roomRepository.findById(roomId).orElseThrow();
        User requester = userRepository.findByEmail(requesterEmail).orElseThrow();
        if (!room.getHost().getId().equals(requester.getId())) {
            throw new RuntimeException("Only host can process waitlist");
        }
        User targetUser = userRepository.findById(java.util.UUID.fromString(userId)).orElseThrow();
        RoomMember member = roomMemberRepository.findByRoomAndUser(room, targetUser).orElseThrow();
        
        if (accept) {
            member.setStatus("APPROVED");
            roomMemberRepository.save(member);
            RoomMemberResponse broadcastMember = RoomMemberResponse.builder()
                    .id(member.getUser().getId().toString())
                    .name(member.getUser().getName())
                    .role(member.getRole())
                    .status("APPROVED")
                    .joinedAt(member.getJoinedAt())
                    .build();
            logActivity(room, requester, "Accepted " + targetUser.getName());
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    roomSocketHandler.broadcastToRoom(room.getId().toString(), "members.join", broadcastMember);
                    roomSocketHandler.broadcastToUser(room.getId().toString(), userId, "waitlist.status", "ACCEPTED");
                }
            });
        } else {
            member.setStatus("REJECTED");
            roomMemberRepository.save(member);
            logActivity(room, requester, "Rejected " + targetUser.getName());
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    roomSocketHandler.broadcastToUser(room.getId().toString(), userId, "waitlist.status", "REJECTED");
                }
            });
        }
    }

    public List<com.codecollab.dto.response.VoicePermissionResponse> getVoicePermissions(String roomId) {
        Room room = roomRepository.findById(roomId).orElseThrow();
        return voicePermissionRepository.findByRoom(room).stream()
                .map(v -> com.codecollab.dto.response.VoicePermissionResponse.builder()
                        .userId(v.getUser().getId().toString())
                        .isMuted(v.getIsMuted())
                        .build())
                .collect(Collectors.toList());
    }

    private RoomResponse mapToRoomResponse(Room room, List<RoomMember> members) {
        List<RoomMemberResponse> memberResponses = members.stream()
                .map(m -> RoomMemberResponse.builder()
                        .id(m.getUser().getId().toString())
                        .name(m.getUser().getName())
                        .role(m.getRole())
                        .status(m.getStatus())
                        .joinedAt(m.getJoinedAt())
                        .build())
                .collect(Collectors.toList());

        List<ChatPayload> previousChats = roomChatRepository.findByRoomOrderByCreatedAtAsc(room).stream()
                .map(c -> {
                    ChatPayload cp = new ChatPayload();
                    cp.setRoomId(room.getId());
                    cp.setUserId(c.getUser().getId());
                    cp.setUserName(c.getUser().getName());
                    cp.setMessage(c.getMessage());
                    cp.setTimestamp(c.getCreatedAt());
                    return cp;
                }).collect(Collectors.toList());

        List<RoomLogResponse> previousLogs = roomLogRepository.findByRoomOrderByCreatedAtAsc(room).stream()
                .map(l -> RoomLogResponse.builder()
                        .id(l.getId())
                        .userId(l.getUser().getId().toString())
                        .userName(l.getUser().getName())
                        .action(l.getAction())
                        .timestamp(l.getCreatedAt())
                        .build())
                .collect(Collectors.toList());

        java.util.Map<String, String> languageCache = new java.util.HashMap<>();
        roomCodeCacheRepository.findByRoom(room).forEach(c -> languageCache.put(c.getLanguage(), c.getSourceCode()));

        List<java.util.Map<String, String>> mappedTestCases = roomTestCaseRepository.findByRoomOrderByCreatedAtAsc(room).stream()
                .map(tc -> {
                    java.util.Map<String, String> map = new java.util.HashMap<>();
                    map.put("input", tc.getInput());
                    map.put("expectedOutput", tc.getExpectedOutput());
                    return map;
                })
                .collect(Collectors.toList());

        return RoomResponse.builder()
                .id(room.getId())
                .name(room.getName())
                .hostId(room.getHost().getId().toString())
                .isActive(room.getIsActive())
                .maxMembers(room.getMaxMembers())
                .createdAt(room.getCreatedAt())
                .expiresAt(room.getExpiresAt())
                .currentCode(room.getCurrentCode())
                .members(memberResponses)
                .chats(previousChats)
                .logs(previousLogs)
                .languageCache(languageCache)
                .testCases(mappedTestCases)
                .build();
    }
}
