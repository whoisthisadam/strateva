package com.strateva.goal.web.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record KpiRequest(
        @NotBlank(message = "Введите наименование показателя")
        @Size(max = 200, message = "Наименование не длиннее 200 символов")
        String name,

        @NotNull(message = "Укажите целевое значение")
        @DecimalMin(value = "0.0", inclusive = true, message = "Целевое значение не может быть отрицательным")
        BigDecimal targetValue,

        @DecimalMin(value = "0.0", inclusive = true, message = "Текущее значение не может быть отрицательным")
        BigDecimal currentValue,

        @Size(max = 40, message = "Единица измерения не длиннее 40 символов")
        String unit
) {}
