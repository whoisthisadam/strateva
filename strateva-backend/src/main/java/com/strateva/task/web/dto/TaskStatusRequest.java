package com.strateva.task.web.dto;

import com.strateva.task.domain.TaskStatus;
import jakarta.validation.constraints.NotNull;

public record TaskStatusRequest(
        @NotNull(message = "Укажите целевой статус")
        TaskStatus status
) {}
