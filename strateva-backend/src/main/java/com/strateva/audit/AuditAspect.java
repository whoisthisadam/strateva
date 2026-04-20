package com.strateva.audit;

import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.lang.reflect.Method;

/**
 * Audits domain-layer mutations annotated with {@link Auditable}.
 * Remains dormant until Phase 4 when the first @Auditable service call is introduced.
 * Auth events are recorded via AuthAuditService instead (see Assumption 7).
 */
@Aspect
@Component
public class AuditAspect {

    private static final Logger log = LoggerFactory.getLogger(AuditAspect.class);

    private final AuditLogRepository repository;

    public AuditAspect(AuditLogRepository repository) {
        this.repository = repository;
    }

    @Around("@annotation(com.strateva.audit.Auditable)")
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public Object aroundAuditable(ProceedingJoinPoint pjp) throws Throwable {
        Object result = pjp.proceed();
        try {
            Method method = ((MethodSignature) pjp.getSignature()).getMethod();
            Auditable annotation = method.getAnnotation(Auditable.class);
            String actor = resolveActor();
            String entityId = result == null ? null : String.valueOf(extractId(result));
            repository.save(new AuditLog(
                    annotation.action(),
                    annotation.entityType(),
                    entityId,
                    actor,
                    null,
                    method.getName()));
        } catch (Exception ex) {
            log.warn("Failed to write audit log for {}: {}", pjp.getSignature(), ex.getMessage());
        }
        return result;
    }

    private String resolveActor() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth == null || auth.getName() == null ? "system" : auth.getName();
    }

    private Object extractId(Object result) {
        try {
            Method getId = result.getClass().getMethod("getId");
            return getId.invoke(result);
        } catch (ReflectiveOperationException ex) {
            return null;
        }
    }
}
