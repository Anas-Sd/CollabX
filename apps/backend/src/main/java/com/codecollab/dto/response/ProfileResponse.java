package com.codecollab.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProfileResponse {
    private String name;
    private String email;
    private String profilePicture;
    private int totalRuns;
    private int totalSubmissions;
    private int totalTestCasesRun;
    private int passedTestCases;
    private double successRate;
    private long avgExecutionTime;
    private long fastestRun;
    private Map<String, Integer> languageUsage;
    private int roomsCreated;
    private int roomsJoined;
    private int sessionsHosted;
}
