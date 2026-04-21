package com.strateva.goal.web.dto;

import com.strateva.goal.domain.GoalStatus;
import com.strateva.goal.domain.Priority;
import com.strateva.goal.domain.StrategicGoal;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record GoalResponse(
        UUID id,
        String title,
        String description,
        LocalDate periodStart,
        LocalDate periodEnd,
        Priority priority,
        GoalStatus status,
        String createdBy,
        Instant createdAt,
        Instant updatedAt,
        List<KpiResponse> kpis
) {
    public static GoalResponse from(StrategicGoal goal) {
        return new GoalResponse(
                goal.getId(),
                goal.getTitle(),
                goal.getDescription(),
                goal.getPeriodStart(),
                goal.getPeriodEnd(),
                goal.getPriority(),
                goal.getStatus(),
                goal.getCreatedBy(),
                goal.getCreatedAt(),
                goal.getUpdatedAt(),
                goal.getKpis().stream().map(KpiResponse::from).toList());
    }
}
