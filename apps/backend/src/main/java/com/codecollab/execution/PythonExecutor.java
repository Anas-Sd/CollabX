package com.codecollab.execution;

import com.codecollab.dto.response.ExecutionResult;
import org.springframework.stereotype.Component;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

@Component
public class PythonExecutor implements CodeExecutor {

    @Override
    public ExecutionResult execute(String code, String stdin) throws IOException, InterruptedException {
        Path tempDir = Files.createTempDirectory("exec_python_");
        try {
            Path file = tempDir.resolve("solution.py");
            Files.writeString(file, code);

            String[] cmd = {"python", "solution.py"};
            return ProcessRunner.runCommand(cmd, tempDir, 10000, stdin);
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
