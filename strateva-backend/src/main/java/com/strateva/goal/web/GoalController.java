package com.strateva.goal.web;

import com.strateva.auth.domain.Role;
import com.strateva.goal.domain.GoalStatus;
import com.strateva.goal.domain.Priority;
import com.strateva.goal.service.GoalService;
import com.strateva.goal.web.dto.GoalCreateRequest;
import com.strateva.goal.web.dto.GoalResponse;
import com.strateva.goal.web.dto.GoalStatusUpdateRequest;
import com.strateva.goal.web.dto.GoalSummary;
import com.strateva.goal.web.dto.GoalUpdateRequest;
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
@RequestMapping("/api/v1/goals")
public class GoalController {

    private final GoalService service;

    public GoalController(GoalService service) {
        this.service = service;
    }

    @PostMapping
    @PreAuthorize("hasRole('PROJECT_MANAGER')")
    public ResponseEntity<GoalResponse> create(@Valid @RequestBody GoalCreateRequest request) {
        GoalResponse goal = service.create(request);
        return ResponseEntity.created(URI.create("/api/v1/goals/" + goal.id())).body(goal);
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasRole('PROJECT_MANAGER')")
    public ResponseEntity<GoalResponse> update(@PathVariable UUID id,
                                               @Valid @RequestBody GoalUpdateRequest request) {
        return ResponseEntity.ok(service.update(id, request));
    }

    @PostMapping("/{id}/submit")
    @PreAuthorize("hasRole('PROJECT_MANAGER')")
    public ResponseEntity<GoalResponse> submit(@PathVariable UUID id) {
        return ResponseEntity.ok(service.submitDocumentation(id));
    }

    @PostMapping("/{id}/status")
    @PreAuthorize("hasRole('PROJECT_MANAGER')")
    public ResponseEntity<GoalResponse> changeStatus(@PathVariable UUID id,
                                                     @Valid @RequestBody GoalStatusUpdateRequest request) {
        return ResponseEntity.ok(service.transition(id, request.status()));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('PROJECT_MANAGER')")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public ResponseEntity<Page<GoalSummary>> list(
            @RequestParam(required = false) GoalStatus status,
            @RequestParam(required = false) Priority priority,
            @RequestParam(required = false) String search,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        if (currentRole() == Role.EMPLOYEE) {
            return ResponseEntity.ok(service.findForEmployee(pageable));
        }
        return ResponseEntity.ok(service.findAll(status, priority, search, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<GoalResponse> findById(@PathVariable UUID id) {
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
}
