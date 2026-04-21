package com.strateva.backlog.domain;

import com.strateva.common.entity.BaseEntity;
import com.strateva.goal.domain.StrategicGoal;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "backlogs", indexes = {
        @Index(name = "idx_backlogs_status", columnList = "status"),
        @Index(name = "idx_backlogs_goal", columnList = "goal_id")
})
public class Backlog extends BaseEntity {

    @Column(name = "title", nullable = false, length = 200)
    private String title;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "goal_id", nullable = false)
    private StrategicGoal goal;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private BacklogStatus status;

    @Column(name = "submitted_at")
    private Instant submittedAt;

    @Column(name = "signed_at")
    private Instant signedAt;

    @Column(name = "signed_by", length = 120)
    private String signedBy;

    @Column(name = "cancelled_at")
    private Instant cancelledAt;

    @Column(name = "cancelled_by", length = 120)
    private String cancelledBy;

    @OneToMany(mappedBy = "backlog", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("createdAt ASC")
    private List<BacklogItem> items = new ArrayList<>();

    protected Backlog() {}

    public Backlog(String title, StrategicGoal goal) {
        this.title = title;
        this.goal = goal;
        this.status = BacklogStatus.DRAFT;
    }

    public String getTitle() { return title; }
    public StrategicGoal getGoal() { return goal; }
    public BacklogStatus getStatus() { return status; }
    public Instant getSubmittedAt() { return submittedAt; }
    public Instant getSignedAt() { return signedAt; }
    public String getSignedBy() { return signedBy; }
    public Instant getCancelledAt() { return cancelledAt; }
    public String getCancelledBy() { return cancelledBy; }
    public List<BacklogItem> getItems() { return items; }

    public void setTitle(String title) { this.title = title; }
    public void setGoal(StrategicGoal goal) { this.goal = goal; }
    public void setStatus(BacklogStatus status) { this.status = status; }
    public void setSubmittedAt(Instant submittedAt) { this.submittedAt = submittedAt; }
    public void setSignedAt(Instant signedAt) { this.signedAt = signedAt; }
    public void setSignedBy(String signedBy) { this.signedBy = signedBy; }
    public void setCancelledAt(Instant cancelledAt) { this.cancelledAt = cancelledAt; }
    public void setCancelledBy(String cancelledBy) { this.cancelledBy = cancelledBy; }

    public void addItem(BacklogItem item) {
        items.add(item);
        item.setBacklog(this);
    }

    public void removeItem(BacklogItem item) {
        items.remove(item);
        item.setBacklog(null);
    }
}
