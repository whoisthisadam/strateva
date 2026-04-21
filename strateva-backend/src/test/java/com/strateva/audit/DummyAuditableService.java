package com.strateva.audit;

import org.springframework.boot.test.context.TestComponent;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Minimal service used by {@link AuditAspectIT} to prove the
 * {@link Auditable @Auditable} aspect writes an {@code audit_log} row end-to-end.
 * Kept in {@code src/test} so it never affects production code.
 */
@TestComponent
public class DummyAuditableService {

    public record Created(UUID id) {
        public UUID getId() { return id; }
    }

    @Auditable(action = AuditAction.CREATE, entityType = "DummyEntity")
    @Transactional
    public Created createDummy() {
        return new Created(UUID.randomUUID());
    }
}
