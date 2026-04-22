package com.codecollab.execution;

import com.codecollab.dto.response.ExecutionResult;
import org.springframework.stereotype.Component;

import java.sql.*;
import java.util.UUID;

@Component
public class SqlExecutor implements CodeExecutor {

    @Override
    public ExecutionResult execute(String code, String stdin) {
        return executeNamed(UUID.randomUUID().toString(), code, stdin);
    }

    public ExecutionResult executeNamed(String userIdentifier, String code, String stdin) {
        String safeName = userIdentifier.replaceAll("[^a-zA-Z0-9]", "_");
        String dbUrl = "jdbc:h2:mem:" + safeName + ";DB_CLOSE_DELAY=-1";
        StringBuilder output = new StringBuilder();
        long startTime = System.currentTimeMillis();

        try (Connection conn = DriverManager.getConnection(dbUrl, "sa", "");
             Statement stmt = conn.createStatement()) {

            if (stdin != null && !stdin.trim().isEmpty()) {
                String[] setups = stdin.split(";");
                for (String setup : setups) {
                    if (!setup.trim().isEmpty()) stmt.execute(setup.trim());
                }
            }

            String[] queries = code.split(";");
            for (String q : queries) {
                String query = q.trim();
                if (query.isEmpty()) continue;

                boolean isResultSet = stmt.execute(query);
                
                if (isResultSet) {
                    try (ResultSet rs = stmt.getResultSet()) {
                        ResultSetMetaData rsmd = rs.getMetaData();
                        int columnsNumber = rsmd.getColumnCount();
                        
                        for (int i = 1; i <= columnsNumber; i++) {
                            output.append(rsmd.getColumnName(i)).append("\t");
                        }
                        output.append("\n");
                        
                        while (rs.next()) {
                            for (int i = 1; i <= columnsNumber; i++) {
                                output.append(rs.getString(i)).append("\t");
                            }
                            output.append("\n");
                        }
                        output.append("\n");
                    }
                } else {
                    int updateCount = stmt.getUpdateCount();
                    String preview = query.length() > 25 ? query.substring(0, 25) + "..." : query;
                    preview = preview.replace("\n", " ");
                    output.append("✓ Executed: [").append(preview).append("] -> Rows affected: ").append(updateCount).append("\n");
                }
            }

            long executionTime = System.currentTimeMillis() - startTime;
            return ExecutionResult.builder()
                    .output(output.toString().trim())
                    .error("")
                    .exitCode(0)
                    .executionTimeMs(executionTime)
                    .build();

        } catch (SQLException e) {
            return errorResult(e.getMessage());
        }
    }
}
