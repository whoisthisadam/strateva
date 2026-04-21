package com.strateva.backlog.web.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;
import java.util.UUID;

public record BacklogCreateRequest(
        @NotBlank(message = "Введите наименование бэклога")
        @Size(max = 200, message = "Наименование не длиннее 200 символов")
        String title,

        @NotNull(message = "Выберите стратегическую цель")
        UUID goalId,

        @Valid
        List<BacklogItemRequest> items
) {}
