package com.codecollab.execution;

import com.codecollab.dto.response.ExecutionResult;
import java.io.*;
import java.nio.file.Path;
import java.util.concurrent.TimeUnit;

public class ProcessRunner {

    public static ExecutionResult runCommand(String[] command, Path workingDir, long timeoutMs, String stdin) throws IOException, InterruptedException {
        ProcessBuilder pb = new ProcessBuilder(command);
        pb.directory(workingDir.toFile());
        
        long startTime = System.currentTimeMillis();
        Process process = pb.start();
        
        // Feed stdin correctly bypassing TTY hangs
        if (stdin != null && !stdin.isEmpty()) {
            try (OutputStream os = process.getOutputStream();
                 BufferedWriter writer = new BufferedWriter(new OutputStreamWriter(os))) {
                writer.write(stdin);
                writer.flush();
            }
        } else {
            // Immediately explicitly close EOF so scanners fail instantly instead of hanging
            process.getOutputStream().close();
        }
        
        boolean finished = process.waitFor(timeoutMs, TimeUnit.MILLISECONDS);
        long executionTime = System.currentTimeMillis() - startTime;
        
        if (!finished) {
            process.destroyForcibly();
            return ExecutionResult.builder()
                    .output("")
                    .error("Execution Timed Out (Exceeded " + (timeoutMs / 1000) + "s)")
                    .exitCode(143)
                    .executionTimeMs(executionTime)
                    .build();
        }

        String output = readStream(process.getInputStream());
        String error = readStream(process.getErrorStream());

        return ExecutionResult.builder()
                .output(output)
                .error(error)
                .exitCode(process.exitValue())
                .executionTimeMs(executionTime)
                .build();
    }

    private static String readStream(InputStream stream) throws IOException {
        StringBuilder builder = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(stream))) {
            String line;
            while ((line = reader.readLine()) != null) {
                builder.append(line).append(System.lineSeparator());
            }
        }
        return builder.toString().trim();
    }
}
