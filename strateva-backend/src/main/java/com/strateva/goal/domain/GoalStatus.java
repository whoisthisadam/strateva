package com.strateva.goal.domain;

/**
 * Lifecycle of a strategic goal. Transitions are enforced by {@code GoalService}:
 * DRAFT → ACTIVE → COMPLETED → ARCHIVED, with DRAFT/ACTIVE/COMPLETED → ARCHIVED also allowed.
 */
public enum GoalStatus {
    DRAFT,
    ACTIVE,
    COMPLETED,
    ARCHIVED
}
