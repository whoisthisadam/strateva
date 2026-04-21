package com.strateva.goal.web.dto;

import com.strateva.goal.domain.GoalStatus;
import com.strateva.goal.domain.Priority;
import com.strateva.goal.domain.StrategicGoal;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Lightweight projection used by {@code GET /api/v1/goals} list.
 * KPIs omitted to keep the payload small; fetch the full goal via {@code GET /{id}}.
 */
public record GoalSummary(
        UUID id,
        String title,
        LocalDate periodStart,
        LocalDate periodEnd,
        Priority priority,
        GoalStatus status,
        Instant createdAt,
        int kpiCount
) {
    public static GoalSummary from(StrategicGoal goal) {
        return new GoalSummary(
                goal.getId(),
                goal.getTitle(),
                goal.getPeriodStart(),
                goal.getPeriodEnd(),
                goal.getPriority(),
                goal.getStatus(),
                goal.getCreatedAt(),
                goal.getKpis().size());
    }
}
