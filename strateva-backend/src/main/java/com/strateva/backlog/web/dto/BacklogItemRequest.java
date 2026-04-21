package com.strateva.backlog.web.dto;

import com.strateva.goal.domain.Priority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record BacklogItemRequest(
        @NotBlank(message = "Введите наименование элемента")
        @Size(max = 200, message = "Наименование не длиннее 200 символов")
        String title,

        @Size(max = 2000, message = "Описание не длиннее 2000 символов")
        String description,

        @NotNull(message = "Укажите приоритет")
        Priority priority
) {}
