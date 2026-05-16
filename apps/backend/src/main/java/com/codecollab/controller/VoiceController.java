package com.codecollab.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/rooms/{roomId}")
public class VoiceController {

    @Value("${agora.app.id:}")
    private String appId;

    @Value("${agora.app.certificate:}")
    private String appCertificate;

    // Get Agora token (token generation handled client-side via Next.js API route)
    @GetMapping("/agora-token")
    public ResponseEntity<String> getAgoraToken(@PathVariable String roomId) {
        // Simple token handler. In a production app with the full Agora SDK,
        // this would use RtcTokenBuilder builder = new RtcTokenBuilder(); 
        // to generate a time-limited privileged token using appCertificate.
        // Returning a dummy token as the Agora package isn't strictly declared in the pom currently.
        return ResponseEntity.ok("dummy-agora-token-" + roomId);
    }
}
