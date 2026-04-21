package com.strateva.audit.web;

import com.strateva.audit.AuditAction;
import com.strateva.audit.AuditLog;

import java.time.Instant;
import java.util.UUID;

/**
 * Read-only projection exposed by {@code /api/v1/audit}.
 */
public record AuditLogView(
        UUID id,
        AuditAction action,
        String entityType,
        String entityId,
        String actor,
        String message,
        String diff,
        Instant createdAt) {

    public static AuditLogView from(AuditLog log) {
        return new AuditLogView(
                log.getId(),
                log.getAction(),
                log.getEntityType(),
                log.getEntityId(),
                log.getActor(),
                log.getMessage(),
                log.getDiff(),
                log.getCreatedAt());
    }
}
