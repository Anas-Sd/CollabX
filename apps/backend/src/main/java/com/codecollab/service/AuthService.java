package com.codecollab.service;

import com.codecollab.dto.request.LoginRequest;
import com.codecollab.dto.request.RegisterRequest;
import com.codecollab.dto.response.AuthResponse;
import com.codecollab.dto.response.UserDto;
import com.codecollab.model.User;
import com.codecollab.repository.UserRepository;
import com.codecollab.security.JwtUtil;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @Value("${GOOGLE_CLIENT_ID:test}")
    private String googleClientId;

    public boolean checkEmailExists(String email) {
        return userRepository.existsByEmail(email);
    }

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email is already in use");
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .build();

        user = userRepository.save(user);
        String token = jwtUtil.generateToken(user.getEmail());

        return AuthResponse.builder()
                .token(token)
                .user(mapToUserDto(user))
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new RuntimeException("Invalid email or password");
        }

        user = checkSubscriptionExpiration(user);

        String token = jwtUtil.generateToken(user.getEmail());

        return AuthResponse.builder()
                .token(token)
                .user(mapToUserDto(user))
                .build();
    }

    public AuthResponse googleLogin(String accessToken) {
        try {
            org.springframework.web.client.RestTemplate restTemplate = new org.springframework.web.client.RestTemplate();
            String userInfoUrl = "https://www.googleapis.com/oauth2/v3/userinfo";
            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            headers.setBearerAuth(accessToken);
            org.springframework.http.HttpEntity<String> entity = new org.springframework.http.HttpEntity<>("", headers);
            
            org.springframework.http.ResponseEntity<java.util.Map> response = 
                restTemplate.exchange(userInfoUrl, org.springframework.http.HttpMethod.GET, entity, java.util.Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                java.util.Map<String, Object> payload = response.getBody();
                String email = (String) payload.get("email");
                String name = (String) payload.get("name");

                User user = userRepository.findByEmail(email).orElseGet(() -> {
                    User newUser = User.builder()
                            .name(name)
                            .email(email)
                            .passwordHash(passwordEncoder.encode(java.util.UUID.randomUUID().toString()))
                            .build();
                    return userRepository.save(newUser);
                });

                user = checkSubscriptionExpiration(user);
                String token = jwtUtil.generateToken(user.getEmail());

                return AuthResponse.builder()
                        .token(token)
                        .user(mapToUserDto(user))
                        .build();
            } else {
                throw new RuntimeException("Invalid Google token");
            }
        } catch (Exception e) {
            throw new RuntimeException("Google authentication failed", e);
        }
    }

    public UserDto getCurrentUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user = checkSubscriptionExpiration(user);
        return mapToUserDto(user);
    }

    public void resetPassword(String email, String newPassword) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    private User checkSubscriptionExpiration(User user) {
        if ("PRO".equals(user.getSubscriptionType()) && user.getSubscriptionExpiresAt() != null) {
            if (user.getSubscriptionExpiresAt().isBefore(java.time.LocalDateTime.now())) {
                user.setSubscriptionType("FREE");
                user = userRepository.save(user);
            }
        }
        return user;
    }

    private UserDto mapToUserDto(User user) {
        return UserDto.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .subscriptionType(user.getSubscriptionType())
                .createdAt(user.getCreatedAt())
                .subscriptionExpiresAt(user.getSubscriptionExpiresAt())
                .build();
    }
}
