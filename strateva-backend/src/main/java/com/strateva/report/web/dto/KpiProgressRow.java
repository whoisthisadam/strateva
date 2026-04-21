package com.strateva.report.web.dto;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * One row of the «Прогресс по KPI» report: percent equals currentValue/targetValue,
 * clamped to the [0, 1000] range to survive over-performing indicators.
 */
public record KpiProgressRow(
        UUID kpiId,
        UUID goalId,
        String goalTitle,
        String name,
        BigDecimal currentValue,
        BigDecimal targetValue,
        String unit,
        double percent) {}
