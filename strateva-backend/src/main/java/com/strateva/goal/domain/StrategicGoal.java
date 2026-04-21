package com.strateva.goal.domain;

import com.strateva.common.entity.BaseEntity;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "strategic_goals", indexes = {
        @Index(name = "idx_goals_status", columnList = "status"),
        @Index(name = "idx_goals_priority", columnList = "priority")
})
public class StrategicGoal extends BaseEntity {

    @Column(name = "title", nullable = false, length = 200)
    private String title;

    @Column(name = "description", length = 2000)
    private String description;

    @Column(name = "period_start", nullable = false)
    private LocalDate periodStart;

    @Column(name = "period_end", nullable = false)
    private LocalDate periodEnd;

    @Enumerated(EnumType.STRING)
    @Column(name = "priority", nullable = false, length = 20)
    private Priority priority;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private GoalStatus status;

    @OneToMany(mappedBy = "goal", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("name ASC")
    private List<Kpi> kpis = new ArrayList<>();

    protected StrategicGoal() {}

    public StrategicGoal(String title, String description,
                         LocalDate periodStart, LocalDate periodEnd,
                         Priority priority) {
        this.title = title;
        this.description = description;
        this.periodStart = periodStart;
        this.periodEnd = periodEnd;
        this.priority = priority;
        this.status = GoalStatus.DRAFT;
    }

    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public LocalDate getPeriodStart() { return periodStart; }
    public LocalDate getPeriodEnd() { return periodEnd; }
    public Priority getPriority() { return priority; }
    public GoalStatus getStatus() { return status; }
    public List<Kpi> getKpis() { return kpis; }

    public void setTitle(String title) { this.title = title; }
    public void setDescription(String description) { this.description = description; }
    public void setPeriodStart(LocalDate periodStart) { this.periodStart = periodStart; }
    public void setPeriodEnd(LocalDate periodEnd) { this.periodEnd = periodEnd; }
    public void setPriority(Priority priority) { this.priority = priority; }
    public void setStatus(GoalStatus status) { this.status = status; }

    public void addKpi(Kpi kpi) {
        kpis.add(kpi);
        kpi.setGoal(this);
    }

    public void clearKpis() {
        kpis.clear();
    }
}
