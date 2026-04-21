package com.strateva.task.web.dto;

import com.strateva.goal.domain.Priority;
import com.strateva.task.domain.Task;
import com.strateva.task.domain.TaskStatus;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Lightweight projection used by {@code GET /api/v1/tasks} list.
 * Description omitted; fetch the full task via {@code GET /{id}}.
 */
public record TaskSummary(
        UUID id,
        String title,
        UUID goalId,
        String goalTitle,
        Priority priority,
        TaskStatus status,
        LocalDate deadline,
        String assignedTo,
        String createdBy,
        Instant createdAt
) {
    public static TaskSummary from(Task task) {
        return new TaskSummary(
                task.getId(),
                task.getTitle(),
                task.getGoal().getId(),
                task.getGoal().getTitle(),
                task.getPriority(),
                task.getStatus(),
                task.getDeadline(),
                task.getAssignedTo(),
                task.getCreatedBy(),
                task.getCreatedAt());
    }
}
