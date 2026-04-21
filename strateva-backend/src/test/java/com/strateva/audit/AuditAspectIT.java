package com.strateva.audit;

import com.strateva.support.AbstractPostgresIT;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;
import org.springframework.security.test.context.support.WithMockUser;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Verifies that {@link AuditAspect} writes an {@code audit_log} row on each
 * invocation of a method marked {@link Auditable @Auditable}. Uses the
 * test-scope {@link DummyAuditableService} so production code remains clean.
 */
@Import(DummyAuditableService.class)
class AuditAspectIT extends AbstractPostgresIT {

    @Autowired
    private DummyAuditableService dummyService;

    @Autowired
    private AuditLogRepository repository;

    @Test
    @WithMockUser(username = "pm")
    void auditableMethodWritesAuditLogRow() {
        DummyAuditableService.Created created = dummyService.createDummy();

        List<AuditLog> rows = repository.findAll();
        assertThat(rows).hasSize(1);
        AuditLog entry = rows.get(0);
        assertThat(entry.getAction()).isEqualTo(AuditAction.CREATE);
        assertThat(entry.getEntityType()).isEqualTo("DummyEntity");
        assertThat(entry.getEntityId()).isEqualTo(created.id().toString());
        assertThat(entry.getActor()).isEqualTo("pm");
        assertThat(entry.getMessage()).isEqualTo("createDummy");
        assertThat(entry.getCreatedAt()).isNotNull();
    }

    @Test
    void auditableMethodWithoutAuthenticationRecordsSystemActor() {
        dummyService.createDummy();

        List<AuditLog> rows = repository.findAll();
        assertThat(rows).hasSize(1);
        assertThat(rows.get(0).getActor()).isEqualTo("system");
    }
}
