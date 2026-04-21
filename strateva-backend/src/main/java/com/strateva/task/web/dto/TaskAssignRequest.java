package com.strateva.task.web.dto;

import jakarta.validation.constraints.NotBlank;

public record TaskAssignRequest(
        @NotBlank(message = "Укажите исполнителя")
        String assignee
) {}
