package com.codecollab.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class RoomResponse {
    private String id;
    private String name;
    private String hostId;
    private Boolean isActive;
    private Integer maxMembers;
    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;
    private String currentCode;
    private String currentLanguage;
    
    private List<RoomMemberResponse> members;
    private List<com.codecollab.dto.request.ChatPayload> chats;
    private List<RoomLogResponse> logs;
    private java.util.Map<String, String> languageCache;
    private List<java.util.Map<String, String>> testCases;
}
