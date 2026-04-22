package com.codecollab.websocket;

import com.codecollab.dto.request.ActionPayload;
import com.codecollab.dto.request.ChatPayload;
import com.codecollab.dto.request.CodeChangePayload;
import com.codecollab.dto.request.CursorPayload;
import com.codecollab.model.User;
import com.codecollab.repository.UserRepository;
import com.codecollab.security.JwtUtil;
import com.codecollab.service.RoomService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.net.URI;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Slf4j
@Component
public class RoomSocketHandler extends TextWebSocketHandler {

    // RoomId -> List of actively connected sessions
    private final Map<String, List<WebSocketSession>> roomSessions = new ConcurrentHashMap<>();
    
    // SessionId -> User info map to quickly retrieve user by socket session
    private final Map<String, User> sessionUsers = new ConcurrentHashMap<>();

    private final ObjectMapper objectMapper;
    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;
    
    // Lazy to avoid circular dependency loop if RoomService uses RoomSocketHandler
    private final RoomService roomService;

    public RoomSocketHandler(ObjectMapper objectMapper, JwtUtil jwtUtil, UserRepository userRepository, @Lazy RoomService roomService) {
        this.objectMapper = objectMapper;
        this.jwtUtil = jwtUtil;
        this.userRepository = userRepository;
        this.roomService = roomService;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        try {
            URI uri = session.getUri();
            if (uri == null) {
                session.close(CloseStatus.BAD_DATA);
                return;
            }

            // Simple token extraction from query params
            String query = uri.getQuery(); // e.g. token=123&roomId=456
            if (query == null) {
                session.close(CloseStatus.POLICY_VIOLATION);
                return;
            }

            String token = extractQueryParam(query, "token");
            String roomId = extractQueryParam(query, "roomId");

            if (token == null || roomId == null) {
                session.close(CloseStatus.POLICY_VIOLATION);
                return;
            }

            String email = jwtUtil.extractEmail(token);
            if (email != null && jwtUtil.isTokenValid(token, email)) {
                User user = userRepository.findByEmail(email).orElse(null);
                if (user != null) {
                    sessionUsers.put(session.getId(), user);
                    roomSessions.computeIfAbsent(roomId, k -> new CopyOnWriteArrayList<>()).add(session);
                    session.getAttributes().put("roomId", roomId);
                    log.info("WebSocket User Connected: {} to Room: {}", user.getName(), roomId);
                } else {
                    session.close(CloseStatus.POLICY_VIOLATION);
                }
            } else {
                session.close(CloseStatus.POLICY_VIOLATION);
            }
        } catch (Exception e) {
            log.error("Error during connection establishment", e);
            session.close(CloseStatus.SERVER_ERROR);
        }
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String roomId = (String) session.getAttributes().get("roomId");
        if (roomId == null) return;
        
        User user = sessionUsers.get(session.getId());
        if (user == null) return;

        try {
            JsonNode root = objectMapper.readTree(message.getPayload());
            String action = root.has("action") ? root.get("action").asText() : "UNKNOWN";
            JsonNode payloadNode = root.get("payload");

            switch (action) {
                case "CODE_CHANGE":
                    // Fallback to updating default code
                    String codeContent = payloadNode.has("code") ? payloadNode.get("code").asText() : "";
                    String currentLang = payloadNode.has("language") ? payloadNode.get("language").asText() : "java";
                    roomService.updateRoomCodeCache(roomId, currentLang, codeContent);
                    broadcastToRoomFilterSender(roomId, session.getId(), "code.change", payloadNode);
                    break;
                case "CHAT_SEND":
                    ChatPayload chatSend = objectMapper.treeToValue(payloadNode, ChatPayload.class);
                    chatSend.setTimestamp(java.time.LocalDateTime.now());
                    chatSend.setUserId(user.getId());
                    chatSend.setUserName(user.getName());
                    roomService.saveChat(roomId, chatSend);
                    
                    java.util.Map<String, String> chatRes = new java.util.HashMap<>();
                    chatRes.put("userName", user.getName());
                    chatRes.put("message", chatSend.getMessage());
                    broadcastToRoom(roomId, "chat", chatRes);
                    break;
                case "CURSOR_MOVE":
                    CursorPayload cursorMove = objectMapper.treeToValue(payloadNode, CursorPayload.class);
                    broadcastToRoomFilterSender(roomId, session.getId(), "cursor", cursorMove);
                    break;
                case "ACTION_TRIGGER":
                    ActionPayload actionTrigger = objectMapper.treeToValue(payloadNode, ActionPayload.class);
                    roomService.logExecutionNative(roomId, actionTrigger.getUserId(), actionTrigger.getType());
                    broadcastToRoom(roomId, "action", actionTrigger);
                    break;
                case "EXECUTION_SYNC":
                    broadcastToRoomFilterSender(roomId, session.getId(), "execution.sync", payloadNode);
                    break;
                case "TEST_CASES_SYNC":
                    roomService.removeTestCases(roomId); // Clear old natively
                    if (payloadNode.isArray()) {
                        for (JsonNode tcNode : payloadNode) {
                             String input = tcNode.has("input") ? tcNode.get("input").asText() : "";
                             String exp = tcNode.has("expectedOutput") ? tcNode.get("expectedOutput").asText() : "";
                             roomService.saveTestCase(roomId, input, exp);
                        }
                    }
                    broadcastToRoomFilterSender(roomId, session.getId(), "testcases.sync", payloadNode);
                    break;
                case "EXECUTION_STATUS_SYNC":
                    broadcastToRoomFilterSender(roomId, session.getId(), "execution.status", payloadNode);
                    break;
                default:
                    log.warn("Unknown action received: {}", action);
            }
        } catch (Exception e) {
            log.error("Failed handling WS message", e);
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        String roomId = (String) session.getAttributes().get("roomId");
        if (roomId != null) {
            List<WebSocketSession> sessions = roomSessions.get(roomId);
            if (sessions != null) {
                sessions.remove(session);
                if (sessions.isEmpty()) {
                    roomSessions.remove(roomId);
                }
            }
        }
        User user = sessionUsers.remove(session.getId());
        if (user != null) {
            log.info("WebSocket User Disconnected: {}", user.getName());
        }
    }

    // --- Broadcasting Utilities ---
    
    public void broadcastToRoom(String roomId, String destination, Object payload) {
        List<WebSocketSession> sessions = roomSessions.get(roomId);
        if (sessions == null || sessions.isEmpty()) return;

        try {
            String jsonMessage = createBroadcastPayload(destination, payload);
            TextMessage textMessage = new TextMessage(jsonMessage);
            for (WebSocketSession session : sessions) {
                if (session.isOpen()) {
                    sendMessageSafe(session, textMessage);
                }
            }
        } catch (Exception e) {
            log.error("Failed to broadcast message to room " + roomId, e);
        }
    }

    public void broadcastToRoomFilterSender(String roomId, String senderSessionId, String destination, Object payload) {
        List<WebSocketSession> sessions = roomSessions.get(roomId);
        if (sessions == null || sessions.isEmpty()) return;

        try {
            String jsonMessage = createBroadcastPayload(destination, payload);
            TextMessage textMessage = new TextMessage(jsonMessage);
            for (WebSocketSession session : sessions) {
                if (session.isOpen() && !session.getId().equals(senderSessionId)) {
                    sendMessageSafe(session, textMessage);
                }
            }
        } catch (Exception e) {
            log.error("Failed to broadcast mapped message to room " + roomId, e);
        }
    }
    
    public void broadcastToUser(String roomId, String targetUserId, String destination, Object payload) {
        List<WebSocketSession> sessions = roomSessions.get(roomId);
        if (sessions == null || sessions.isEmpty()) return;
        
        try {
            String jsonMessage = createBroadcastPayload(destination, payload);
            TextMessage textMessage = new TextMessage(jsonMessage);
            for (WebSocketSession session : sessions) {
                User user = sessionUsers.get(session.getId());
                if (session.isOpen() && user != null && user.getId().toString().equals(targetUserId)) {
                    sendMessageSafe(session, textMessage);
                }
            }
        } catch (Exception e) {
            log.error("Failed to broadcast to specific user " + targetUserId, e);
        }
    }

    private String createBroadcastPayload(String destination, Object payload) throws JsonProcessingException {
        // Wrap payload in STOMP-like generic routing wrapper
        Map<String, Object> messageMap = new java.util.HashMap<>();
        messageMap.put("destination", destination);
        messageMap.put("body", payload != null ? payload : "");
        return objectMapper.writeValueAsString(messageMap);
    }
    
    private void sendMessageSafe(WebSocketSession session, TextMessage message) {
        try {
            synchronized(session) {
                session.sendMessage(message);
            }
        } catch (IOException e) {
            log.error("Failed to write to WS session", e);
        }
    }

    private String extractQueryParam(String query, String param) {
        String[] pairs = query.split("&");
        for (String pair : pairs) {
            String[] kv = pair.split("=");
            if (kv.length == 2 && kv[0].equals(param)) {
                return kv[1];
            }
        }
        return null;
    }
}
