package com.strateva.backlog.web.dto;

import com.strateva.backlog.domain.Backlog;
import com.strateva.backlog.domain.BacklogStatus;

import java.time.Instant;
import java.util.UUID;

/**
 * Lightweight projection used by {@code GET /api/v1/backlogs} list.
 * Items omitted; fetch the full backlog via {@code GET /{id}}.
 */
public record BacklogSummary(
        UUID id,
        String title,
        UUID goalId,
        String goalTitle,
        BacklogStatus status,
        String createdBy,
        Instant createdAt,
        Instant submittedAt,
        Instant signedAt,
        int itemCount
) {
    public static BacklogSummary from(Backlog backlog) {
        return new BacklogSummary(
                backlog.getId(),
                backlog.getTitle(),
                backlog.getGoal().getId(),
                backlog.getGoal().getTitle(),
                backlog.getStatus(),
                backlog.getCreatedBy(),
                backlog.getCreatedAt(),
                backlog.getSubmittedAt(),
                backlog.getSignedAt(),
                backlog.getItems().size());
    }
}
