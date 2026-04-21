package com.strateva.report.web.dto;

import com.strateva.task.domain.TaskStatus;

/**
 * One bucket of the «Загрузка сотрудников» report: tasks grouped by assignee
 * and status. {@code assignee} is {@code null} when the task has not been
 * assigned yet; the frontend renders such rows as «Не назначено».
 */
public record TaskWorkloadRow(
        String assignee,
        TaskStatus status,
        long count) {}
