package com.codecollab.service;

import com.codecollab.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class DatabaseKeepAliveService {

    private final UserRepository userRepository;

    /**
     * Executes a lightweight count query every 48 hours to ensure active 
     * database connections and prevent free tier databases (e.g., Supabase) 
     * from auto-pausing due to inactivity.
     */
    @Scheduled(fixedRate = 172800000) // Every 48 hours (in milliseconds)
    public void pingDatabase() {
        try {
            long count = userRepository.count();
            log.info("[Supabase Keep-Alive] Database pinged successfully. Total users registered: {}", count);
        } catch (Exception e) {
            log.error("[Supabase Keep-Alive] Database ping failed: {}", e.getMessage(), e);
        }
    }
}
