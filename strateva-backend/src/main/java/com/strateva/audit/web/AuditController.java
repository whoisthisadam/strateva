package com.strateva.audit.web;

import com.strateva.audit.AuditLog;
import com.strateva.audit.AuditLogRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;

/**
 * Read-only audit log viewer. Available to project managers only;
 * other roles receive 403 via {@link org.springframework.security.access.AccessDeniedException}.
 */
@RestController
@RequestMapping("/api/v1/audit")
@PreAuthorize("hasRole('PROJECT_MANAGER')")
public class AuditController {

    private final AuditLogRepository repository;

    public AuditController(AuditLogRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public ResponseEntity<Page<AuditLogView>> list(
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) String entityId,
            @RequestParam(required = false) String performedBy,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC)
            Pageable pageable) {

        Specification<AuditLog> spec = AuditLogSpecifications.entityType(entityType)
                .and(AuditLogSpecifications.entityId(entityId))
                .and(AuditLogSpecifications.performedBy(performedBy))
                .and(AuditLogSpecifications.createdFrom(from))
                .and(AuditLogSpecifications.createdTo(to));

        Page<AuditLogView> page = repository.findAll(spec, pageable).map(AuditLogView::from);
        return ResponseEntity.ok(page);
    }
}
