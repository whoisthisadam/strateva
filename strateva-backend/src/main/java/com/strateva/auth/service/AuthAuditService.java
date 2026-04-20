package com.strateva.auth.service;

import com.strateva.audit.AuditAction;
import com.strateva.audit.AuditLog;
import com.strateva.audit.AuditLogRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * Writes audit_log rows for login flows. Called directly — not via @Auditable —
 * because failure paths never reach a successful service-bean boundary (see plan Assumption 7).
 */
@Service
public class AuthAuditService {

    private static final String ENTITY_TYPE = "User";

    private final AuditLogRepository repository;

    public AuthAuditService(AuditLogRepository repository) {
        this.repository = repository;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordLoginSuccess(String username, String userId) {
        repository.save(new AuditLog(AuditAction.LOGIN_SUCCESS, ENTITY_TYPE, userId,
                username, null, "Успешный вход в систему"));
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordLoginFailure(String username, String reason) {
        repository.save(new AuditLog(AuditAction.LOGIN_FAILURE, ENTITY_TYPE, null,
                username == null ? "unknown" : username, null, reason));
    }
}
