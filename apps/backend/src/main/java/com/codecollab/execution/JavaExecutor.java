package com.codecollab.execution;

import com.codecollab.dto.response.ExecutionResult;
import org.springframework.stereotype.Component;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

@Component
public class JavaExecutor implements CodeExecutor {

    @Override
    public ExecutionResult execute(String code, String stdin) throws IOException, InterruptedException {
        Path tempDir = Files.createTempDirectory("exec_java_");
        try {
            Path file = tempDir.resolve("Main.java");
            Files.writeString(file, code);

            // Compile
            String[] compileCmd = {"javac", "Main.java"};
            ExecutionResult compileResult = ProcessRunner.runCommand(compileCmd, tempDir, 10000, "");
            if (compileResult.getExitCode() != 0) {
                return compileResult; // Syntax error
            }

            // Run
            String[] runCmd = {"java", "Main"};
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
