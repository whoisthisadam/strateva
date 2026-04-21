package com.strateva.goal.domain;

import com.strateva.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.math.BigDecimal;

@Entity
@Table(name = "kpis")
public class Kpi extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "goal_id", nullable = false)
    private StrategicGoal goal;

    @Column(name = "name", nullable = false, length = 200)
    private String name;

    @Column(name = "target_value", nullable = false, precision = 18, scale = 4)
    private BigDecimal targetValue;

    @Column(name = "current_value", nullable = false, precision = 18, scale = 4)
    private BigDecimal currentValue;

    @Column(name = "unit", length = 40)
    private String unit;

    protected Kpi() {}

    public Kpi(String name, BigDecimal targetValue, BigDecimal currentValue, String unit) {
        this.name = name;
        this.targetValue = targetValue;
        this.currentValue = currentValue == null ? BigDecimal.ZERO : currentValue;
        this.unit = unit;
    }

    public StrategicGoal getGoal() { return goal; }
    public String getName() { return name; }
    public BigDecimal getTargetValue() { return targetValue; }
    public BigDecimal getCurrentValue() { return currentValue; }
    public String getUnit() { return unit; }

    public void setGoal(StrategicGoal goal) { this.goal = goal; }
    public void setName(String name) { this.name = name; }
    public void setTargetValue(BigDecimal targetValue) { this.targetValue = targetValue; }
    public void setCurrentValue(BigDecimal currentValue) { this.currentValue = currentValue; }
    public void setUnit(String unit) { this.unit = unit; }
}
