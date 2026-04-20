package com.strateva.auth.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LoginRequest(
        @NotBlank(message = "Логин обязателен")
        @Size(max = 80, message = "Логин не должен превышать 80 символов")
        String username,

        @NotBlank(message = "Пароль обязателен")
        @Size(max = 200, message = "Пароль слишком длинный")
        String password
) {}
