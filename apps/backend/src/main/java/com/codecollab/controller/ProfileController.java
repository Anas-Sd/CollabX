package com.codecollab.controller;

import com.codecollab.dto.request.ChangePasswordRequest;
import com.codecollab.dto.request.UpdateProfileRequest;
import com.codecollab.dto.response.ProfileResponse;
import com.codecollab.service.ProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService profileService;

    // Get profile
    @GetMapping
    public ResponseEntity<ProfileResponse> getProfile(Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(profileService.getUserProfile(email));
    }

    // Update profile
    @PutMapping
    public ResponseEntity<ProfileResponse> updateProfile(
            @Valid @RequestBody UpdateProfileRequest request,
            Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(profileService.updateProfile(email, request));
    }

    // Change password
    @PostMapping("/password")
    public ResponseEntity<Void> changePassword(
            @Valid @RequestBody ChangePasswordRequest request,
            Authentication authentication) {
        String email = authentication.getName();
        profileService.changePassword(email, request);
        return ResponseEntity.ok().build();
    }

    // Delete account
    @DeleteMapping
    public ResponseEntity<Void> deleteAccount(Authentication authentication) {
        String email = authentication.getName();
        profileService.deleteAccount(email);
        return ResponseEntity.ok().build();
    }
}
