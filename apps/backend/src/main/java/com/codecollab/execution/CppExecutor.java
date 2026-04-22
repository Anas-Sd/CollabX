package com.codecollab.execution;

import com.codecollab.dto.response.ExecutionResult;
import org.springframework.stereotype.Component;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

@Component
public class CppExecutor implements CodeExecutor {

    @Override
    public ExecutionResult execute(String code, String stdin) throws IOException, InterruptedException {
        Path tempDir = Files.createTempDirectory("exec_cpp_");
        try {
            Path file = tempDir.resolve("solution.cpp");
            Files.writeString(file, code);

            // Compile
            String[] compileCmd = {"g++", "-o", "solution", "solution.cpp", "-std=c++17"};
            ExecutionResult compileResult = ProcessRunner.runCommand(compileCmd, tempDir, 10000, "");
            if (compileResult.getExitCode() != 0) {
                return compileResult; // Compilation error
            }

            // Run
            String executable = System.getProperty("os.name").toLowerCase().contains("win") ? "solution.exe" : "./solution";
            String[] runCmd = {executable};
            return ProcessRunner.runCommand(runCmd, tempDir, 10000, stdin);
        } finally {
            deleteDirectory(tempDir.toFile());
        }
    }
    
    private void deleteDirectory(java.io.File directoryToBeDeleted) {
        java.io.File[] allContents = directoryToBeDeleted.listFiles();
        if (allContents != null) {
            for (java.io.File file : allContents) {
                deleteDirectory(file);
            }
        }
        directoryToBeDeleted.delete();
    }
}
