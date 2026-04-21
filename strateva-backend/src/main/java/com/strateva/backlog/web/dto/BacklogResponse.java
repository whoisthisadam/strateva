package com.strateva.backlog.web.dto;

import com.strateva.backlog.domain.Backlog;
import com.strateva.backlog.domain.BacklogStatus;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record BacklogResponse(
        UUID id,
        String title,
        UUID goalId,
        String goalTitle,
        BacklogStatus status,
        String createdBy,
        Instant createdAt,
        Instant updatedAt,
        Instant submittedAt,
        Instant signedAt,
        String signedBy,
        Instant cancelledAt,
        String cancelledBy,
        List<BacklogItemResponse> items
) {
    public static BacklogResponse from(Backlog backlog) {
        return new BacklogResponse(
                backlog.getId(),
                backlog.getTitle(),
                backlog.getGoal().getId(),
                backlog.getGoal().getTitle(),
                backlog.getStatus(),
                backlog.getCreatedBy(),
                backlog.getCreatedAt(),
                backlog.getUpdatedAt(),
                backlog.getSubmittedAt(),
                backlog.getSignedAt(),
                backlog.getSignedBy(),
                backlog.getCancelledAt(),
                backlog.getCancelledBy(),
                backlog.getItems().stream().map(BacklogItemResponse::from).toList());
    }
}
