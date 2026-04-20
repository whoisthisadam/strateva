package com.strateva.auth.web;

import com.strateva.auth.domain.User;
import com.strateva.auth.domain.UserRepository;
import com.strateva.auth.service.AuthService;
import com.strateva.auth.web.dto.LoginRequest;
import com.strateva.auth.web.dto.LoginResponse;
import com.strateva.auth.web.dto.UserSummary;
import com.strateva.common.error.NotFoundException;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;
    private final UserRepository userRepository;

    public AuthController(AuthService authService, UserRepository userRepository) {
        this.authService = authService;
        this.userRepository = userRepository;
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @GetMapping("/me")
    public ResponseEntity<UserSummary> me() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) {
            throw new NotFoundException("Текущий пользователь не найден");
        }
        User user = userRepository.findByUsername(auth.getName())
                .orElseThrow(() -> new NotFoundException("Текущий пользователь не найден"));
        return ResponseEntity.ok(UserSummary.from(user));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout() {
        SecurityContextHolder.clearContext();
        return ResponseEntity.noContent().build();
    }
}
