package com.codecollab.dto.request;

import lombok.Data;

@Data
public class TestCaseRequest {
    private String input;
    private String expectedOutput;
}
