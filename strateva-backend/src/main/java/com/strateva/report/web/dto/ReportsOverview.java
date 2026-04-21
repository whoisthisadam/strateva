package com.strateva.report.web.dto;

import java.time.Instant;

/**
 * Header block for the analytics landing page: total/active goal counts,
 * task totals, overdue-task count and signed-backlog count. All numbers are
 * sourced live from the database (BR-6).
 */
public record ReportsOverview(
        Instant generatedAt,
        String generatedBy,
        long goalsTotal,
        long goalsActive,
        long tasksTotal,
        long tasksDone,
        long tasksOverdue,
        long backlogsSigned) {}
