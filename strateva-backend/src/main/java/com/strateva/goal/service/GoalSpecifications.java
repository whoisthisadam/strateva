package com.strateva.goal.service;

import com.strateva.goal.domain.GoalStatus;
import com.strateva.goal.domain.Priority;
import com.strateva.goal.domain.StrategicGoal;
import com.strateva.task.domain.Task;
import jakarta.persistence.criteria.Subquery;
import org.springframework.data.jpa.domain.Specification;

final class GoalSpecifications {

    private GoalSpecifications() {}

    static Specification<StrategicGoal> status(GoalStatus status) {
        return (root, query, cb) -> status == null ? null : cb.equal(root.get("status"), status);
    }

    static Specification<StrategicGoal> priority(Priority priority) {
        return (root, query, cb) -> priority == null ? null : cb.equal(root.get("priority"), priority);
    }

    static Specification<StrategicGoal> titleContains(String fragment) {
        return (root, query, cb) -> {
            if (fragment == null || fragment.isBlank()) return null;
            return cb.like(cb.lower(root.get("title")), "%" + fragment.toLowerCase() + "%");
        };
    }

    /**
     * UC-9 scoping: goal must have at least one task assigned to {@code username}.
     */
    static Specification<StrategicGoal> hasTaskAssignedTo(String username) {
        return (root, query, cb) -> {
            if (username == null || username.isBlank()) return null;
            Subquery<Long> sub = query.subquery(Long.class);
            var task = sub.from(Task.class);
            sub.select(cb.literal(1L))
                    .where(cb.and(
                            cb.equal(task.get("goal"), root),
                            cb.equal(task.get("assignedTo"), username)));
            return cb.exists(sub);
        };
    }
}
