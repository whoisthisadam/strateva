package com.strateva.task.web.dto;

import com.strateva.goal.domain.Priority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record TaskUpdateRequest(
        @NotBlank(message = "Введите наименование задачи")
        @Size(max = 200, message = "Наименование не длиннее 200 символов")
        String title,

        @Size(max = 2000, message = "Описание не длиннее 2000 символов")
        String description,

        @NotNull(message = "Укажите приоритет")
        Priority priority,

        LocalDate deadline
) {}
