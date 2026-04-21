package com.strateva.goal.web.dto;

import com.strateva.goal.domain.Priority;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.List;

public record GoalCreateRequest(
        @NotBlank(message = "Введите наименование цели")
        @Size(max = 200, message = "Наименование не длиннее 200 символов")
        String title,

        @Size(max = 2000, message = "Описание не длиннее 2000 символов")
        String description,

        @NotNull(message = "Укажите дату начала периода")
        LocalDate periodStart,

        @NotNull(message = "Укажите дату окончания периода")
        LocalDate periodEnd,

        @NotNull(message = "Укажите приоритет")
        Priority priority,

        @Valid
        List<KpiRequest> kpis
) {}
