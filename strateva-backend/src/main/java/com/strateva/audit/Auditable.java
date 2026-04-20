package com.strateva.audit;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Marks a service-layer method whose invocation must be recorded in the audit_log.
 * Handled by {@link AuditAspect}. Wiring becomes active in Phase 4 when the first
 * domain aggregate is mutated through such a method.
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface Auditable {
    AuditAction action();

    /** Entity type being audited, e.g. "Goal", "Backlog". */
    String entityType();
}
