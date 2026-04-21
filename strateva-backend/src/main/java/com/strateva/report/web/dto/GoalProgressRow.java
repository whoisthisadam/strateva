package com.strateva.report.web.dto;

import com.strateva.goal.domain.GoalStatus;

import java.util.UUID;

/**
 * One row of the «Прогресс по целям» report: percent equals doneTasks/totalTasks,
 * rounded to one decimal. Returns 0.0 when a goal has no tasks yet.
 */
public record GoalProgressRow(
        UUID goalId,
        String title,
        GoalStatus status,
        long totalTasks,
        long doneTasks,
        double percent) {}
