package com.codecollab.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RoleUpdateRequest {
    @NotBlank
    private String role;
}
