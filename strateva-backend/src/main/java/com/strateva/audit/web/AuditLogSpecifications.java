package com.strateva.audit.web;

import com.strateva.audit.AuditLog;
import org.springframework.data.jpa.domain.Specification;

import java.time.Instant;

/**
 * Builds {@link Specification} instances for filtering {@link AuditLog} rows.
 * Each filter is optional; combine with {@link Specification#allOf}.
 */
final class AuditLogSpecifications {

    private AuditLogSpecifications() {}

    private static <T> Specification<T> always() {
        return (root, query, cb) -> cb.conjunction();
    }

    static Specification<AuditLog> entityType(String entityType) {
        if (entityType == null || entityType.isBlank()) {
            return always();
        }
        return (root, query, cb) -> cb.equal(root.get("entityType"), entityType);
    }

    static Specification<AuditLog> entityId(String entityId) {
        if (entityId == null || entityId.isBlank()) {
            return always();
        }
        return (root, query, cb) -> cb.equal(root.get("entityId"), entityId);
    }

    static Specification<AuditLog> performedBy(String actor) {
        if (actor == null || actor.isBlank()) {
            return always();
        }
        return (root, query, cb) -> cb.equal(root.get("actor"), actor);
    }

    static Specification<AuditLog> createdFrom(Instant from) {
        if (from == null) {
            return always();
        }
        return (root, query, cb) -> cb.greaterThanOrEqualTo(root.get("createdAt"), from);
    }

    static Specification<AuditLog> createdTo(Instant to) {
        if (to == null) {
            return always();
        }
        return (root, query, cb) -> cb.lessThanOrEqualTo(root.get("createdAt"), to);
    }
}
