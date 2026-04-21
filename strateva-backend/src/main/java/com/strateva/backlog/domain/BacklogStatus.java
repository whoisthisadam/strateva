package com.strateva.backlog.domain;

/**
 * Lifecycle of a backlog. Transitions are enforced by {@code BacklogService}:
 * DRAFT → SUBMITTED → SIGNED (terminal), plus DRAFT|SUBMITTED → CANCELLED (terminal).
 */
public enum BacklogStatus {
    DRAFT,
    SUBMITTED,
    SIGNED,
    CANCELLED
}
