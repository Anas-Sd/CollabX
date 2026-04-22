package com.codecollab.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class TransferHostRequest {
    @NotBlank
    private String newHostId;
}
