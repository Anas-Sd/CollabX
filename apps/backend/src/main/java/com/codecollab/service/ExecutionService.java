package com.codecollab.service;

import com.codecollab.dto.response.ExecutionResult;
import com.codecollab.model.User;
import com.codecollab.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Lazy;
import com.codecollab.websocket.RoomSocketHandler;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.HashMap;
import java.util.Map;
import java.util.Base64;
import java.nio.charset.StandardCharsets;
import java.io.File;

@Service
public class ExecutionService {

    private final UserRepository userRepository;
    private final RoomSocketHandler roomSocketHandler;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public ExecutionService(UserRepository userRepository, @Lazy RoomSocketHandler roomSocketHandler) {
        this.userRepository = userRepository;
        this.roomSocketHandler = roomSocketHandler;
    }

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

        if (roomId != null) {
            Map<String, Object> progress = new java.util.HashMap<>();
            progress.put("stage", "COMPILING");
            roomSocketHandler.broadcastToRoom(roomId, "execution.progress", progress);
        }

        if ("sql".equalsIgnoreCase(language) && roomId != null) {
            return executeSqlLocal(code, roomId);
        }

        return executeCodeInternal(code, language, stdin);
    }

    public com.codecollab.dto.response.SubmitCodeResponse submitCode(String userEmail, com.codecollab.dto.request.SubmitCodeRequest request) {
        userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        java.util.List<com.codecollab.dto.response.TestResultResponse> results = new java.util.ArrayList<>();
        
        try {
            int totalTests = request.getTestCases().size();
            for (int i = 0; i < totalTests; i++) {
                com.codecollab.dto.request.TestCaseRequest testCase = request.getTestCases().get(i);
                
                // Broadcast exact test case running state
                if (request.getRoomId() != null) {
                    Map<String, Object> progress = new java.util.HashMap<>();
                    progress.put("stage", "RUNNING_TEST");
                    progress.put("current", i + 1);
                    progress.put("total", totalTests);
                    roomSocketHandler.broadcastToRoom(request.getRoomId(), "execution.progress", progress);
                }

                ExecutionResult execResult;
                if ("sql".equalsIgnoreCase(request.getLanguage()) && request.getRoomId() != null) {
                    // For submitting tests in SQL, execute the schema/query along with the test input if provided
                    String combinedCode = request.getCode();
                    if (testCase.getInput() != null && !testCase.getInput().trim().isEmpty()) {
                         combinedCode = testCase.getInput() + "\n" + combinedCode;
                    }
                    execResult = executeSqlLocal(combinedCode, request.getRoomId());
                } else {
                    execResult = executeCodeInternal(request.getCode(), request.getLanguage(), testCase.getInput());
                }
                
                String actualOut = execResult.getOutput() != null ? execResult.getOutput().trim() : "";
                if (execResult.getExitCode() != 0) {
                   actualOut = execResult.getError() != null ? execResult.getError().trim() : "Execution Error";
                }
                
                String expectedOut = testCase.getExpectedOutput() != null ? testCase.getExpectedOutput().trim() : "";
                String actualNormalized = actualOut.replace("\r", "");
                String expectedNormalized = expectedOut.replace("\r", "");
                boolean passed = execResult.getExitCode() == 0 && actualNormalized.equals(expectedNormalized);
                
                results.add(com.codecollab.dto.response.TestResultResponse.builder()
                        .input(testCase.getInput())
                        .expectedOutput(expectedOut)
                        .actualOutput(actualOut)
                        .passed(passed)
                        .executionTimeMs(execResult.getExecutionTimeMs())
                        .build());
            }

            boolean allPassed = results.stream().allMatch(com.codecollab.dto.response.TestResultResponse::isPassed);

            return com.codecollab.dto.response.SubmitCodeResponse.builder()
                    .results(results)
                    .allPassed(allPassed)
                    .build();
        } catch (Exception e) {
            throw new RuntimeException("Failed to run test cases", e);
        }
    }

    private String preprocessSql(String code) {
        if (code == null) return "";
        // Inject missing semicolons before major SQL keywords to support multi-line execution
        String processed = code.replaceAll("(?i)([^;\\s])(\\s*)\\n(\\s*(?:SELECT|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER|WITH|TRUNCATE|REPLACE)\\b)", "$1;$2\n$3");
        if (!processed.trim().isEmpty() && !processed.trim().endsWith(";")) {
            processed += ";";
        }
        return processed;
    }

    private ExecutionResult executeSqlLocal(String code, String roomId) {
        long startTime = System.currentTimeMillis();
        
        // Ensure data directory exists
        File dataDir = new File("./data/rooms");
        if (!dataDir.exists()) dataDir.mkdirs();
        
        String dbUrl = "jdbc:h2:file:./data/rooms/room_" + roomId + ";MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DEFAULT_NULL_ORDERING=HIGH";
        StringBuilder output = new StringBuilder();
        
        try (java.sql.Connection conn = java.sql.DriverManager.getConnection(dbUrl, "sa", "");
             java.sql.Statement stmt = conn.createStatement()) {
            
            String preprocessedCode = preprocessSql(code);
            String[] statements = preprocessedCode.split("(?<=;)");
            
            for (String sql : statements) {
                if (sql.trim().isEmpty()) continue;
                
                boolean hasResultSet = stmt.execute(sql.trim());
                
                while (hasResultSet || stmt.getUpdateCount() != -1) {
                    if (hasResultSet) {
                        try (java.sql.ResultSet rs = stmt.getResultSet()) {
                            java.sql.ResultSetMetaData metaData = rs.getMetaData();
                            int columnCount = metaData.getColumnCount();
                            
                            // Print headers
                            for (int j = 1; j <= columnCount; j++) {
                                output.append(metaData.getColumnName(j));
                                if (j < columnCount) output.append("\t| ");
                            }
                            output.append("\n");
                            for (int j = 0; j < columnCount * 12; j++) output.append("-");
                            output.append("\n");
                            
                            // Print rows
                            while (rs.next()) {
                                for (int j = 1; j <= columnCount; j++) {
                                    String val = rs.getString(j);
                                    output.append(val != null ? val : "NULL");
                                    if (j < columnCount) output.append("\t| ");
                                }
                                output.append("\n");
                            }
                            output.append("\n");
                        }
                    } else {
                        int updateCount = stmt.getUpdateCount();
                        if (updateCount >= 0) {
                            String lower = sql.toLowerCase().trim();
                            if (lower.startsWith("create table")) {
                                output.append("Table created successfully.\n");
                            } else if (lower.startsWith("insert")) {
                                output.append(updateCount).append(" row(s) inserted successfully.\n");
                            } else if (lower.startsWith("update")) {
                                output.append(updateCount).append(" row(s) updated successfully.\n");
                            } else if (lower.startsWith("delete")) {
                                output.append(updateCount).append(" row(s) deleted successfully.\n");
                            } else if (lower.startsWith("drop table")) {
                                output.append("Table dropped successfully.\n");
                            } else {
                                output.append("Executed successfully (").append(updateCount).append(" row(s) affected).\n");
                            }
                        }
                    }
                    hasResultSet = stmt.getMoreResults();
                }
            }
            
            return ExecutionResult.builder()
                    .output(output.toString().trim())
                    .error("")
                    .exitCode(0)
                    .executionTimeMs(System.currentTimeMillis() - startTime)
                    .compilationError(false)
                    .build();
            
        } catch (Exception e) {
            return ExecutionResult.builder()
                    .output("")
                    .error("SQL Error: " + e.getMessage())
                    .exitCode(1)
                    .executionTimeMs(System.currentTimeMillis() - startTime)
                    .compilationError(false)
                    .build();
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
