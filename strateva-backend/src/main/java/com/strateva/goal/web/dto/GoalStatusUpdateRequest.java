package com.strateva.goal.web.dto;

import com.strateva.goal.domain.GoalStatus;
import jakarta.validation.constraints.NotNull;

public record GoalStatusUpdateRequest(
        @NotNull(message = "Укажите целевой статус")
        GoalStatus status
) {}
