package com.strateva.goal.web.dto;

import com.strateva.goal.domain.Kpi;

import java.math.BigDecimal;
import java.util.UUID;

public record KpiResponse(
        UUID id,
        String name,
        BigDecimal targetValue,
        BigDecimal currentValue,
        String unit
) {
    public static KpiResponse from(Kpi kpi) {
        return new KpiResponse(
                kpi.getId(),
                kpi.getName(),
                kpi.getTargetValue(),
                kpi.getCurrentValue(),
                kpi.getUnit());
    }
}
