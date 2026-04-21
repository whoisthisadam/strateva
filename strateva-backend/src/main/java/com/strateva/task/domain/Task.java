package com.strateva.task.domain;

import com.strateva.backlog.domain.BacklogItem;
import com.strateva.common.entity.BaseEntity;
import com.strateva.goal.domain.Priority;
import com.strateva.goal.domain.StrategicGoal;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.LocalDate;

@Entity
@Table(name = "tasks", indexes = {
        @Index(name = "idx_tasks_status", columnList = "status"),
        @Index(name = "idx_tasks_goal", columnList = "goal_id"),
        @Index(name = "idx_tasks_assigned_to", columnList = "assigned_to")
})
public class Task extends BaseEntity {

    @Column(name = "title", nullable = false, length = 200)
    private String title;

    @Column(name = "description", length = 2000)
    private String description;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "goal_id", nullable = false)
    private StrategicGoal goal;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "backlog_item_id")
    private BacklogItem backlogItem;

    @Enumerated(EnumType.STRING)
    @Column(name = "priority", nullable = false, length = 20)
    private Priority priority;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private TaskStatus status;

    @Column(name = "deadline")
    private LocalDate deadline;

    @Column(name = "assigned_to", length = 120)
    private String assignedTo;

    protected Task() {}

    public Task(String title, String description, StrategicGoal goal,
                BacklogItem backlogItem, Priority priority, LocalDate deadline) {
        this.title = title;
        this.description = description;
        this.goal = goal;
        this.backlogItem = backlogItem;
        this.priority = priority;
        this.deadline = deadline;
        this.status = TaskStatus.TODO;
    }

    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public StrategicGoal getGoal() { return goal; }
    public BacklogItem getBacklogItem() { return backlogItem; }
    public Priority getPriority() { return priority; }
    public TaskStatus getStatus() { return status; }
    public LocalDate getDeadline() { return deadline; }
    public String getAssignedTo() { return assignedTo; }

    public void setTitle(String title) { this.title = title; }
    public void setDescription(String description) { this.description = description; }
    public void setBacklogItem(BacklogItem backlogItem) { this.backlogItem = backlogItem; }
    public void setPriority(Priority priority) { this.priority = priority; }
    public void setStatus(TaskStatus status) { this.status = status; }
    public void setDeadline(LocalDate deadline) { this.deadline = deadline; }
    public void setAssignedTo(String assignedTo) { this.assignedTo = assignedTo; }
}
