package com.strateva.task.domain;

/**
 * Lifecycle of an operational task. Transitions are enforced by {@code TaskService}
 * via {@code TaskTransitions}; {@code DONE} is terminal. Leaving {@code TODO} is
 * additionally gated by BR-3 (the task must be assigned).
 */
public enum TaskStatus {
    TODO,
    IN_PROGRESS,
    DONE,
    BLOCKED
}
