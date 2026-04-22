package com.codecollab.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class HistoryRequest {
    @NotBlank
    private String code;
    @NotBlank
    private String language;
}
