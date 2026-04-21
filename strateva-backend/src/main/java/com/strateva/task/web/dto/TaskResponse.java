package com.strateva.task.web.dto;

import com.strateva.goal.domain.Priority;
import com.strateva.task.domain.Task;
import com.strateva.task.domain.TaskStatus;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record TaskResponse(
        UUID id,
        String title,
        String description,
        UUID goalId,
        String goalTitle,
        UUID backlogItemId,
        String backlogItemTitle,
        Priority priority,
        TaskStatus status,
        LocalDate deadline,
        String assignedTo,
        String createdBy,
        Instant createdAt,
        Instant updatedAt
) {
    public static TaskResponse from(Task task) {
        return new TaskResponse(
                task.getId(),
                task.getTitle(),
                task.getDescription(),
                task.getGoal().getId(),
                task.getGoal().getTitle(),
                task.getBacklogItem() == null ? null : task.getBacklogItem().getId(),
                task.getBacklogItem() == null ? null : task.getBacklogItem().getTitle(),
                task.getPriority(),
                task.getStatus(),
                task.getDeadline(),
                task.getAssignedTo(),
                task.getCreatedBy(),
                task.getCreatedAt(),
                task.getUpdatedAt());
    }
}
