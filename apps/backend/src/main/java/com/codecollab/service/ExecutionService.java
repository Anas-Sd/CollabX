package com.codecollab.service;

import com.codecollab.dto.response.ExecutionResult;
import com.codecollab.model.User;
import com.codecollab.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.HashMap;
import java.util.Map;
import java.util.Base64;
import java.nio.charset.StandardCharsets;

@Service
@RequiredArgsConstructor
public class ExecutionService {

    private final UserRepository userRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${judge0.api-url}")
    private String judge0Url;

    @Value("${judge0.api-key}")
    private String judge0Key;

    private int getLanguageId(String language) {
        return switch (language.toLowerCase()) {
            case "java" -> 62;
            case "python" -> 71;
            case "cpp", "c++" -> 54;
            case "c" -> 50;
            case "javascript", "node" -> 93;
            case "sql" -> 82; // SQLite fallback format for standard Judge0
            default -> -1;
        };
    }

    public ExecutionResult executeCode(String userEmail, String code, String language, String stdin, String roomId) {
        // Authenticate standard user flow without restricting via Redis
        userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return executeCodeInternal(code, language, stdin);
    }

    public com.codecollab.dto.response.SubmitCodeResponse submitCode(String userEmail, com.codecollab.dto.request.SubmitCodeRequest request) {
        userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Utilize a dedicated ThreadPool to prevent starving the default JVM ForkJoinPool on heavy concurrency
        java.util.concurrent.ExecutorService executor = java.util.concurrent.Executors.newFixedThreadPool(5);
        try {
            java.util.List<java.util.concurrent.CompletableFuture<com.codecollab.dto.response.TestResultResponse>> futures = request.getTestCases().stream()
                    .map(testCase -> java.util.concurrent.CompletableFuture.supplyAsync(() -> {
                        ExecutionResult execResult = executeCodeInternal(request.getCode(), request.getLanguage(), testCase.getInput());
                        
                        String actualOut = execResult.getOutput() != null ? execResult.getOutput().trim() : "";
                        if (execResult.getExitCode() != 0) {
                           actualOut = execResult.getError() != null ? execResult.getError().trim() : "Execution Error";
                        }
                        
                        String expectedOut = testCase.getExpectedOutput() != null ? testCase.getExpectedOutput().trim() : "";
                        
                        // Normalize outputs by removing carriage returns (\r) to fix CRLF vs LF mismatches
                        String actualNormalized = actualOut.replace("\r", "");
                        String expectedNormalized = expectedOut.replace("\r", "");
                        
                        boolean passed = execResult.getExitCode() == 0 && actualNormalized.equals(expectedNormalized);
                        
                        return com.codecollab.dto.response.TestResultResponse.builder()
                                .input(testCase.getInput())
                                .expectedOutput(expectedOut)
                                .actualOutput(actualOut)
                                .passed(passed)
                                .executionTimeMs(execResult.getExecutionTimeMs())
                                .build();
                    }, executor))
                    .toList();

            java.util.List<com.codecollab.dto.response.TestResultResponse> results = futures.stream()
                    .map(java.util.concurrent.CompletableFuture::join)
                    .toList();

            boolean allPassed = results.stream().allMatch(com.codecollab.dto.response.TestResultResponse::isPassed);

            return com.codecollab.dto.response.SubmitCodeResponse.builder()
                    .results(results)
                    .allPassed(allPassed)
                    .build();
        } finally {
            executor.shutdown();
        }
    }

    private ExecutionResult executeCodeInternal(String code, String language, String stdin) {
        int langId = getLanguageId(language);
        if (langId == -1) {
            return ExecutionResult.builder()
                    .output("")
                    .error("Unsupported language: " + language)
                    .exitCode(1)
                    .executionTimeMs(0)
                    .compilationError(false)
                    .build();
        }

        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("source_code", Base64.getEncoder().encodeToString(code.getBytes(StandardCharsets.UTF_8)));
            payload.put("language_id", langId);
            if (stdin != null && !stdin.trim().isEmpty()) {
                payload.put("stdin", Base64.getEncoder().encodeToString(stdin.getBytes(StandardCharsets.UTF_8)));
            }

            String jsonPayload = objectMapper.writeValueAsString(payload);

            HttpRequest.Builder requestBuilder = HttpRequest.newBuilder()
                    .uri(new URI(judge0Url + "/submissions?base64_encoded=true&wait=true"))
                    .timeout(Duration.ofSeconds(15))
                    .header("Content-Type", "application/json");
                    
            if (judge0Key != null && !judge0Key.trim().isEmpty()) {
                requestBuilder.header("x-rapidapi-key", judge0Key);
                requestBuilder.header("x-rapidapi-host", URI.create(judge0Url).getHost());
            }

            HttpRequest request = requestBuilder.POST(HttpRequest.BodyPublishers.ofString(jsonPayload)).build();
            HttpClient client = HttpClient.newHttpClient();
            
            long startTime = System.currentTimeMillis();
            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            long executionTime = System.currentTimeMillis() - startTime;

            if (response.statusCode() == 201 || response.statusCode() == 200) {
                com.fasterxml.jackson.databind.JsonNode responseNode = objectMapper.readTree(response.body());
                
                String stdout = "";
                if (responseNode.hasNonNull("stdout")) {
                    stdout = new String(Base64.getDecoder().decode(responseNode.get("stdout").asText()), StandardCharsets.UTF_8);
                }
                
                String stderr = "";
                if (responseNode.hasNonNull("stderr")) {
                    stderr = new String(Base64.getDecoder().decode(responseNode.get("stderr").asText()), StandardCharsets.UTF_8);
                }
                
                String compileOutput = "";
                if (responseNode.hasNonNull("compile_output")) {
                    compileOutput = new String(Base64.getDecoder().decode(responseNode.get("compile_output").asText()), StandardCharsets.UTF_8);
                }
                
                int statusId = responseNode.get("status").get("id").asInt();
                
                if (statusId == 3) { // Accepted
                    return ExecutionResult.builder()
                            .output(stdout.replace("\n", "\r\n"))
                            .error("")
                            .exitCode(0)
                            .executionTimeMs(executionTime)
                            .compilationError(false)
                            .build();
                } else {
                    String errorMsg = stderr.isEmpty() ? compileOutput : stderr;
                    if (errorMsg.isEmpty()) errorMsg = responseNode.get("status").get("description").asText();
                    return ExecutionResult.builder()
                            .output(stdout)
                            .error(errorMsg)
                            .exitCode(1)
                            .executionTimeMs(executionTime)
                            .compilationError(statusId == 6)
                            .build();
                }
            } else {
                return ExecutionResult.builder()
                        .output("")
                        .error("Judge0 API Error: HTTP " + response.statusCode() + " - " + response.body())
                        .exitCode(1)
                        .executionTimeMs(executionTime)
                        .compilationError(false)
                        .build();
            }

        } catch (Exception e) {
            return ExecutionResult.builder()
                    .output("")
                    .error("System connection error: " + e.getMessage())
                    .exitCode(1)
                    .executionTimeMs(0)
                    .compilationError(false)
                    .build();
        }
    }
}
