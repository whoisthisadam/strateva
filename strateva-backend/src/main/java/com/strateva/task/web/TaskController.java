package com.strateva.task.web;

import com.strateva.auth.domain.Role;
import com.strateva.goal.domain.Priority;
import com.strateva.task.domain.TaskStatus;
import com.strateva.task.service.TaskService;
import com.strateva.task.web.dto.TaskAssignRequest;
import com.strateva.task.web.dto.TaskCreateRequest;
import com.strateva.task.web.dto.TaskResponse;
import com.strateva.task.web.dto.TaskStatusRequest;
import com.strateva.task.web.dto.TaskSummary;
import com.strateva.task.web.dto.TaskUpdateRequest;
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
@RequestMapping("/api/v1/tasks")
public class TaskController {

    private final TaskService service;

    public TaskController(TaskService service) {
        this.service = service;
    }

    @PostMapping
    @PreAuthorize("hasRole('PROJECT_MANAGER')")
    public ResponseEntity<TaskResponse> create(@Valid @RequestBody TaskCreateRequest request) {
        TaskResponse task = service.create(request);
        return ResponseEntity.created(URI.create("/api/v1/tasks/" + task.id())).body(task);
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasRole('PROJECT_MANAGER')")
    public ResponseEntity<TaskResponse> update(@PathVariable UUID id,
                                               @Valid @RequestBody TaskUpdateRequest request) {
        return ResponseEntity.ok(service.update(id, request));
    }

    @PostMapping("/{id}/assignee")
    @PreAuthorize("hasRole('PROJECT_MANAGER')")
    public ResponseEntity<TaskResponse> assign(@PathVariable UUID id,
                                               @Valid @RequestBody TaskAssignRequest request) {
        return ResponseEntity.ok(service.assign(id, request.assignee()));
    }

    @PostMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('PROJECT_MANAGER','EMPLOYEE')")
    public ResponseEntity<TaskResponse> changeStatus(@PathVariable UUID id,
                                                     @Valid @RequestBody TaskStatusRequest request) {
        return ResponseEntity.ok(service.changeStatus(id, request.status(), currentActor(), currentRole()));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('PROJECT_MANAGER')")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('PROJECT_MANAGER','BUSINESS_ANALYST','EMPLOYEE')")
    public ResponseEntity<Page<TaskSummary>> list(
            @RequestParam(required = false) TaskStatus status,
            @RequestParam(required = false) Priority priority,
            @RequestParam(required = false) UUID goalId,
            @RequestParam(required = false) String assignee,
            @RequestParam(required = false) String search,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        // UC-9: EMPLOYEE sees only their own tasks; role-forced filter overrides any client-supplied value.
        String effectiveAssignee = currentRole() == Role.EMPLOYEE ? currentActor() : assignee;
        return ResponseEntity.ok(service.findAll(status, priority, goalId, effectiveAssignee, search, pageable));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('PROJECT_MANAGER','BUSINESS_ANALYST','EMPLOYEE')")
    public ResponseEntity<TaskResponse> findById(@PathVariable UUID id) {
        TaskResponse task = service.findById(id);
        if (currentRole() == Role.EMPLOYEE
                && (task.assignedTo() == null || !task.assignedTo().equals(currentActor()))) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.NOT_FOUND).build();
        }
        return ResponseEntity.ok(task);
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
