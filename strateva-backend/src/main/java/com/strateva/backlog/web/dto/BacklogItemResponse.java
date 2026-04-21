package com.strateva.backlog.web.dto;

import com.strateva.backlog.domain.BacklogItem;
import com.strateva.goal.domain.Priority;

import java.util.UUID;

public record BacklogItemResponse(
        UUID id,
        String title,
        String description,
        Priority priority
) {
    public static BacklogItemResponse from(BacklogItem item) {
        return new BacklogItemResponse(
                item.getId(),
                item.getTitle(),
                item.getDescription(),
                item.getPriority());
    }
}
