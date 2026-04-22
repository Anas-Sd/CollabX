package com.codecollab.dto.request;

import lombok.Data;

@Data
public class CreateOrderRequest {
    private int amount;
    private String currency; // usually INR
}
