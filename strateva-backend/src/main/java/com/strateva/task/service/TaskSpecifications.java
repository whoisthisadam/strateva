package com.strateva.task.service;

import com.strateva.goal.domain.Priority;
import com.strateva.task.domain.Task;
import com.strateva.task.domain.TaskStatus;
import org.springframework.data.jpa.domain.Specification;

import java.util.UUID;

final class TaskSpecifications {

    private TaskSpecifications() {}

    static Specification<Task> status(TaskStatus status) {
        return (root, query, cb) -> status == null ? null : cb.equal(root.get("status"), status);
    }

    static Specification<Task> priority(Priority priority) {
        return (root, query, cb) -> priority == null ? null : cb.equal(root.get("priority"), priority);
    }

    static Specification<Task> goalId(UUID goalId) {
        return (root, query, cb) -> goalId == null ? null : cb.equal(root.get("goal").get("id"), goalId);
    }

    static Specification<Task> assignedTo(String username) {
        return (root, query, cb) -> username == null || username.isBlank()
                ? null
                : cb.equal(root.get("assignedTo"), username);
    }

    static Specification<Task> titleContains(String fragment) {
        return (root, query, cb) -> {
            if (fragment == null || fragment.isBlank()) return null;
            return cb.like(cb.lower(root.get("title")), "%" + fragment.toLowerCase() + "%");
        };
    }
}
