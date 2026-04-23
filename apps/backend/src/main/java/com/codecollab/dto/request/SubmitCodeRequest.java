package com.codecollab.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;
import java.util.List;

@Data
public class SubmitCodeRequest {
    @NotBlank
    private String roomId;
    @NotBlank
    private String code;
    @NotBlank
    private String language;
    @NotEmpty
    private List<TestCaseRequest> testCases;
}
