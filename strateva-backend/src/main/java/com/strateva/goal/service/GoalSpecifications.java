package com.strateva.goal.service;

import com.strateva.goal.domain.GoalStatus;
import com.strateva.goal.domain.Priority;
import com.strateva.goal.domain.StrategicGoal;
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
}
