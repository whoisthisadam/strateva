package com.strateva.task.service;

import com.strateva.task.domain.TaskStatus;

import java.util.Map;
import java.util.Set;

/**
 * Encodes the legal state-machine for tasks.
 * BR-3 (may leave TODO only when assigned) is enforced separately in {@code TaskService}.
 * DONE is terminal. BLOCKED is a parking state — once unblocked, a task returns to
 * IN_PROGRESS.
 */
final class TaskTransitions {

    private static final Map<TaskStatus, Set<TaskStatus>> ALLOWED = Map.of(
            TaskStatus.TODO, Set.of(TaskStatus.IN_PROGRESS, TaskStatus.BLOCKED),
            TaskStatus.IN_PROGRESS, Set.of(TaskStatus.DONE, TaskStatus.BLOCKED, TaskStatus.TODO),
            TaskStatus.BLOCKED, Set.of(TaskStatus.IN_PROGRESS, TaskStatus.TODO),
            TaskStatus.DONE, Set.of()
    );

    private TaskTransitions() {}

    static boolean isAllowed(TaskStatus from, TaskStatus to) {
        if (from == to) return false;
        return ALLOWED.getOrDefault(from, Set.of()).contains(to);
    }
}
