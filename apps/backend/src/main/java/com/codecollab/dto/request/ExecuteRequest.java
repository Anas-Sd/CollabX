package com.codecollab.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ExecuteRequest {
    @NotBlank
    private String code;
    @NotBlank
    private String language;
    private String stdin;
    private String roomId;
}
