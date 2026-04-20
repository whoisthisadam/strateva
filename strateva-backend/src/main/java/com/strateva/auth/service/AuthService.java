package com.strateva.auth.service;

import com.strateva.auth.domain.User;
import com.strateva.auth.domain.UserRepository;
import com.strateva.auth.jwt.JwtUtil;
import com.strateva.auth.web.dto.LoginRequest;
import com.strateva.auth.web.dto.LoginResponse;
import com.strateva.auth.web.dto.UserSummary;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    private final AuthAuditService auditService;

    public AuthService(AuthenticationManager authenticationManager,
                       UserRepository userRepository,
                       JwtUtil jwtUtil,
                       AuthAuditService auditService) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.jwtUtil = jwtUtil;
        this.auditService = auditService;
    }

    @Transactional
    public LoginResponse login(LoginRequest request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.username(), request.password()));
        } catch (AuthenticationException ex) {
            auditService.recordLoginFailure(request.username(), mapReason(ex));
            throw ex;
        }
        User user = userRepository.findByUsername(request.username())
                .orElseThrow(() -> new BadCredentialsException("Неверный логин или пароль"));
        String token = jwtUtil.issueToken(user.getUsername(), user.getRole().authority(), user.getId().toString());
        auditService.recordLoginSuccess(user.getUsername(), user.getId().toString());
        return new LoginResponse(token, jwtUtil.expirationMs(), UserSummary.from(user));
    }

    private String mapReason(AuthenticationException ex) {
        if (ex instanceof BadCredentialsException) return "Неверный логин или пароль";
        if (ex instanceof DisabledException) return "Учётная запись отключена";
        if (ex instanceof UsernameNotFoundException) return "Пользователь не найден";
        return "Отказ в аутентификации";
    }
}
