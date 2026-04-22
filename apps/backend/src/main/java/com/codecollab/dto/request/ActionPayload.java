package com.codecollab.dto.request;

import lombok.Data;

@Data
public class ActionPayload {
    private String roomId;
    private String userId;
    private String userName;
    private String type; // RUN_START, RUN_END, SUBMIT
    private Object payload; // output
}
