package com.codecollab.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubmissionRequest {
    @NotBlank
    private String code;
    
    @NotBlank
    private String language;
    
    private String output;
    
    private String status;
}
