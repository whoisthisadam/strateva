package com.strateva.backlog.web;

import com.strateva.auth.domain.Role;
import com.strateva.backlog.domain.BacklogStatus;
import com.strateva.backlog.service.BacklogService;
import com.strateva.backlog.web.dto.BacklogCreateRequest;
import com.strateva.backlog.web.dto.BacklogItemRequest;
import com.strateva.backlog.web.dto.BacklogResponse;
import com.strateva.backlog.web.dto.BacklogSummary;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/backlogs")
public class BacklogController {

    private final BacklogService service;

    public BacklogController(BacklogService service) {
        this.service = service;
    }

    @PostMapping
    @PreAuthorize("hasRole('BUSINESS_ANALYST')")
    public ResponseEntity<BacklogResponse> create(@Valid @RequestBody BacklogCreateRequest request) {
        BacklogResponse backlog = service.create(request);
        return ResponseEntity.created(URI.create("/api/v1/backlogs/" + backlog.id())).body(backlog);
    }

    @PostMapping("/{id}/items")
    @PreAuthorize("hasRole('BUSINESS_ANALYST')")
    public ResponseEntity<BacklogResponse> addItem(@PathVariable UUID id,
                                                   @Valid @RequestBody BacklogItemRequest request) {
        return ResponseEntity.ok(service.addItem(id, request));
    }

    @PatchMapping("/{id}/items/{itemId}")
    @PreAuthorize("hasRole('BUSINESS_ANALYST')")
    public ResponseEntity<BacklogResponse> updateItem(@PathVariable UUID id,
                                                      @PathVariable UUID itemId,
                                                      @Valid @RequestBody BacklogItemRequest request) {
        return ResponseEntity.ok(service.updateItem(id, itemId, request));
    }

    @DeleteMapping("/{id}/items/{itemId}")
    @PreAuthorize("hasRole('BUSINESS_ANALYST')")
    public ResponseEntity<BacklogResponse> removeItem(@PathVariable UUID id,
                                                      @PathVariable UUID itemId) {
        return ResponseEntity.ok(service.removeItem(id, itemId));
    }

    @PostMapping("/{id}/submit")
    @PreAuthorize("hasRole('BUSINESS_ANALYST')")
    public ResponseEntity<BacklogResponse> submit(@PathVariable UUID id) {
        return ResponseEntity.ok(service.submitForApproval(id));
    }

    @PostMapping("/{id}/sign")
    @PreAuthorize("hasRole('PROJECT_MANAGER')")
    public ResponseEntity<BacklogResponse> sign(@PathVariable UUID id) {
        return ResponseEntity.ok(service.sign(id));
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasRole('PROJECT_MANAGER')")
    public ResponseEntity<BacklogResponse> cancel(@PathVariable UUID id) {
        return ResponseEntity.ok(service.cancel(id));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('PROJECT_MANAGER','BUSINESS_ANALYST')")
    public ResponseEntity<Page<BacklogSummary>> list(
            @RequestParam(required = false) BacklogStatus status,
            @RequestParam(required = false) UUID goalId,
            @RequestParam(required = false) String search,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        // BA only sees their own backlogs; PM sees everything.
        String createdByFilter = currentRole() == Role.BUSINESS_ANALYST ? currentActor() : null;
        return ResponseEntity.ok(service.findAll(status, goalId, search, createdByFilter, pageable));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('PROJECT_MANAGER','BUSINESS_ANALYST')")
    public ResponseEntity<BacklogResponse> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(service.findById(id));
    }

    private Role currentRole() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return null;
        return auth.getAuthorities().stream()
                .map(a -> a.getAuthority().replaceFirst("^ROLE_", ""))
                .map(name -> {
                    try { return Role.valueOf(name); }
                    catch (IllegalArgumentException ex) { return null; }
                })
                .filter(r -> r != null)
                .findFirst()
                .orElse(null);
    }

    private String currentActor() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth == null ? null : auth.getName();
    }
}
