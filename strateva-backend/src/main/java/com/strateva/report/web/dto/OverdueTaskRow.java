package com.strateva.report.web.dto;

import com.strateva.goal.domain.Priority;
import com.strateva.task.domain.TaskStatus;

import java.time.LocalDate;
import java.util.UUID;

/**
 * One row of the «Просроченные задачи» report: any non-DONE task whose deadline
 * is strictly before the current date (inclusive cut-off uses the server's clock).
 */
public record OverdueTaskRow(
        UUID taskId,
        String title,
        UUID goalId,
        String goalTitle,
        String assignee,
        LocalDate deadline,
        long daysOverdue,
        TaskStatus status,
        Priority priority) {}
