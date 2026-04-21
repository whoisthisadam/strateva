package com.strateva.backlog.service;

import com.strateva.backlog.domain.Backlog;
import com.strateva.backlog.domain.BacklogStatus;
import org.springframework.data.jpa.domain.Specification;

import java.util.UUID;

final class BacklogSpecifications {

    private BacklogSpecifications() {}

    static Specification<Backlog> status(BacklogStatus status) {
        return (root, query, cb) -> status == null ? null : cb.equal(root.get("status"), status);
    }

    static Specification<Backlog> goalId(UUID goalId) {
        return (root, query, cb) -> goalId == null ? null : cb.equal(root.get("goal").get("id"), goalId);
    }

    static Specification<Backlog> createdBy(String username) {
        return (root, query, cb) -> username == null || username.isBlank()
                ? null
                : cb.equal(root.get("createdBy"), username);
    }

    static Specification<Backlog> titleContains(String fragment) {
        return (root, query, cb) -> {
            if (fragment == null || fragment.isBlank()) return null;
            return cb.like(cb.lower(root.get("title")), "%" + fragment.toLowerCase() + "%");
        };
    }
}
