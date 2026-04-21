package com.strateva.auth.web;

import com.strateva.auth.domain.Role;
import com.strateva.auth.domain.UserRepository;
import com.strateva.auth.web.dto.UserSummary;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Comparator;
import java.util.List;

/**
 * Minimal read-only user directory used by the assignee picker on tasks.
 * Restricted to PROJECT_MANAGER because nothing else currently requires it.
 */
@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    private final UserRepository repository;

    public UserController(UserRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    @PreAuthorize("hasRole('PROJECT_MANAGER')")
    public ResponseEntity<List<UserSummary>> list(@RequestParam(required = false) Role role) {
        List<UserSummary> users = repository.findAll().stream()
                .filter(u -> u.isActive())
                .filter(u -> role == null || u.getRole() == role)
                .sorted(Comparator.comparing(u -> u.getFullName().toLowerCase()))
                .map(UserSummary::from)
                .toList();
        return ResponseEntity.ok(users);
    }
}
