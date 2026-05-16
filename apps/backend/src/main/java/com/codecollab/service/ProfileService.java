package com.codecollab.service;

import com.codecollab.dto.response.ProfileResponse;
import com.codecollab.dto.request.UpdateProfileRequest;
import com.codecollab.model.Room;
import com.codecollab.model.RoomMember;
import com.codecollab.model.Submission;
import com.codecollab.model.User;
import com.codecollab.repository.RoomMemberRepository;
import com.codecollab.repository.RoomMemberRepository;
import com.codecollab.repository.RoomRepository;
import com.codecollab.repository.SubmissionRepository;
import com.codecollab.repository.UserRepository;
import com.codecollab.repository.RoomChatRepository;
import com.codecollab.repository.RoomLogRepository;
import com.codecollab.repository.VoicePermissionRepository;
import com.codecollab.repository.RoomCodeCacheRepository;
import com.codecollab.repository.RoomTestCaseRepository;
import com.codecollab.repository.CodeHistoryRepository;
import com.codecollab.websocket.RoomSocketHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ProfileService {

    private final UserRepository userRepository;
    private final SubmissionRepository submissionRepository;
    private final RoomRepository roomRepository;
    private final RoomMemberRepository roomMemberRepository;
    private final PasswordEncoder passwordEncoder;
    private final RoomChatRepository roomChatRepository;
    private final RoomLogRepository roomLogRepository;
    private final VoicePermissionRepository voicePermissionRepository;
    private final RoomCodeCacheRepository roomCodeCacheRepository;
    private final RoomTestCaseRepository roomTestCaseRepository;
    private final CodeHistoryRepository codeHistoryRepository;

    @Lazy
    private final RoomSocketHandler roomSocketHandler;

    // Get user profile with stats
    public ProfileResponse getUserProfile(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<Submission> submissions = submissionRepository.findTop100ByUserOrderByExecutedAtDesc(user);
        List<Room> hostedRooms = roomRepository.findByHost(user);
        List<RoomMember> joinedRooms = roomMemberRepository.findByUser(user);

        int totalRuns = 0;
        int passedTestCases = 0;
        int totalTestCasesRun = 0;
        long totalExecutionTime = 0;
        long fastestRun = Long.MAX_VALUE;
        Map<String, Integer> languageUsage = new HashMap<>();

        for (Submission sub : submissions) {
            // Count total runs
            totalRuns++;
            
            // Collect language usage
            languageUsage.put(sub.getLanguage(), languageUsage.getOrDefault(sub.getLanguage(), 0) + 1);

            // Time calculation
            long execTime = sub.getExecutionTimeMs() != null ? sub.getExecutionTimeMs() : 0;
            totalExecutionTime += execTime;
            if (execTime > 0 && execTime < fastestRun) {
                fastestRun = execTime;
            }

            if (sub.getTestCasesRun() != null) {
                totalTestCasesRun += sub.getTestCasesRun();
            }
            if (sub.getTestCasesPassed() != null) {
                passedTestCases += sub.getTestCasesPassed();
            } else if ("PASSED".equals(sub.getStatus())) {
                // Fallback for legacy submissions before adding this field
                passedTestCases++;
                totalTestCasesRun++;
            } else if ("FAILED".equals(sub.getStatus())) {
                // Fallback for legacy failed submissions
                totalTestCasesRun++;
            }
        }

        double successRate = totalTestCasesRun > 0 ? ((double) passedTestCases / totalTestCasesRun) * 100.0 : 0.0;
        long avgExecutionTime = totalRuns > 0 ? totalExecutionTime / totalRuns : 0;
        if (fastestRun == Long.MAX_VALUE) fastestRun = 0;

        return ProfileResponse.builder()
                .name(user.getName())
                .email(user.getEmail())
                .profilePicture(user.getProfilePicture())
                .totalRuns(totalRuns)
                .totalSubmissions(totalRuns) // Using totalRuns as submissions per the user's request
                .totalTestCasesRun(totalTestCasesRun)
                .passedTestCases(passedTestCases)
                .successRate(successRate)
                .avgExecutionTime(avgExecutionTime)
                .fastestRun(fastestRun)
                .languageUsage(languageUsage)
                .roomsCreated(hostedRooms.size())
                .roomsJoined(joinedRooms.size())
                .sessionsHosted(hostedRooms.size())
                .build();
    }

    // Update profile info & picture
    public ProfileResponse updateProfile(String email, UpdateProfileRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (request.getName() != null && !request.getName().trim().isEmpty()) {
            user.setName(request.getName().trim());
        }

        // Empty string = remove picture
        if (request.getProfilePicture() != null) {
            if (request.getProfilePicture().trim().isEmpty()) {
                user.setProfilePicture(null);
            } else {
                user.setProfilePicture(request.getProfilePicture());
            }
        }

        userRepository.save(user);
        return getUserProfile(email);
    }

    // Change password
    @Transactional
    public void changePassword(String email, com.codecollab.dto.request.ChangePasswordRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new RuntimeException("Incorrect current password");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    // Delete account & all associated data
    @Transactional
    public void deleteAccount(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Delete direct references to this user
        roomChatRepository.deleteByUser(user);
        roomLogRepository.deleteByUser(user);
        voicePermissionRepository.deleteByUser(user);

        // Delete all submissions by this user
        List<Submission> submissions = submissionRepository.findByUser(user);
        submissionRepository.deleteAll(submissions);

        // Delete all room memberships for this user
        List<RoomMember> memberships = roomMemberRepository.findByUser(user);
        roomMemberRepository.deleteAll(memberships);

        // Delete hosted rooms & notify active participants
        List<Room> hostedRooms = roomRepository.findByHost(user);
        for (Room room : hostedRooms) {
            // Alert any active participants that the room is terminating before we wipe it
            if (roomSocketHandler != null) {
                roomSocketHandler.broadcastToRoom(room.getId().toString(), "end", "ROOM_ENDED_BY_HOST");
            }
            submissionRepository.deleteByRoom(room);
            roomMemberRepository.deleteByRoom(room);
            roomChatRepository.deleteByRoom(room);
            roomLogRepository.deleteByRoom(room);
            voicePermissionRepository.deleteByRoom(room);
            roomCodeCacheRepository.deleteByRoom(room);
            roomTestCaseRepository.deleteByRoom(room);
            codeHistoryRepository.deleteByRoom(room);
            // Delete room itself
            roomRepository.delete(room);
        }

        // Finally delete the user
        userRepository.delete(user);
    }
}
