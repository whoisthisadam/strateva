package com.strateva.goal.domain;

/**
 * Lifecycle of a strategic goal. Transitions are enforced by {@code GoalService}:
 * DRAFT → SUBMITTED → ACTIVE → COMPLETED → ARCHIVED, with ACTIVE → ARCHIVED also allowed.
 */
public enum GoalStatus {
    DRAFT,
    SUBMITTED,
    ACTIVE,
    COMPLETED,
    ARCHIVED
}
