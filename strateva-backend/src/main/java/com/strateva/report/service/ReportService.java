package com.strateva.report.service;

import com.strateva.backlog.domain.Backlog;
import com.strateva.backlog.domain.BacklogRepository;
import com.strateva.backlog.domain.BacklogStatus;
import com.strateva.goal.domain.GoalStatus;
import com.strateva.goal.domain.Kpi;
import com.strateva.goal.domain.StrategicGoal;
import com.strateva.goal.domain.StrategicGoalRepository;
import com.strateva.report.web.dto.BacklogThroughputRow;
import com.strateva.report.web.dto.GoalProgressRow;
import com.strateva.report.web.dto.KpiProgressRow;
import com.strateva.report.web.dto.OverdueTaskRow;
import com.strateva.report.web.dto.ReportsOverview;
import com.strateva.report.web.dto.TaskWorkloadRow;
import com.strateva.task.domain.Task;
import com.strateva.task.domain.TaskRepository;
import com.strateva.task.domain.TaskStatus;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;

/**
 * Phase-7 read-only aggregations. Every query runs against the live database
 * (BR-6); no manual overrides are accepted. The service only exposes methods —
 * role gating is applied one level up in {@code ReportController}.
 */
@Service
@Transactional(readOnly = true)
public class ReportService {

    private static final BigDecimal PERCENT_CAP = BigDecimal.valueOf(1000);
    private static final DateTimeFormatter MONTH_KEY = DateTimeFormatter.ofPattern("yyyy-MM");

    private final StrategicGoalRepository goalRepository;
    private final TaskRepository taskRepository;
    private final BacklogRepository backlogRepository;

    public ReportService(StrategicGoalRepository goalRepository,
                         TaskRepository taskRepository,
                         BacklogRepository backlogRepository) {
        this.goalRepository = goalRepository;
        this.taskRepository = taskRepository;
        this.backlogRepository = backlogRepository;
    }

    public ReportsOverview overview(String actor) {
        List<StrategicGoal> goals = goalRepository.findAll();
        List<Task> tasks = taskRepository.findAll();
        List<Backlog> backlogs = backlogRepository.findAll();
        long active = goals.stream().filter(g -> g.getStatus() == GoalStatus.ACTIVE).count();
        long done = tasks.stream().filter(t -> t.getStatus() == TaskStatus.DONE).count();
        long overdue = tasks.stream().filter(this::isOverdue).count();
        long signed = backlogs.stream().filter(b -> b.getStatus() == BacklogStatus.SIGNED).count();
        return new ReportsOverview(Instant.now(), actor,
                goals.size(), active, tasks.size(), done, overdue, signed);
    }

    public List<GoalProgressRow> goalsProgress() {
        List<StrategicGoal> goals = goalRepository.findAll(Sort.by(Sort.Direction.ASC, "title"));
        List<Task> tasks = taskRepository.findAll();
        Map<java.util.UUID, List<Task>> byGoal = tasks.stream()
                .collect(Collectors.groupingBy(t -> t.getGoal().getId()));
        return goals.stream()
                .map(goal -> {
                    List<Task> goalTasks = byGoal.getOrDefault(goal.getId(), List.of());
                    long total = goalTasks.size();
                    long done = goalTasks.stream().filter(t -> t.getStatus() == TaskStatus.DONE).count();
                    double percent = total == 0 ? 0.0
                            : BigDecimal.valueOf(done * 100.0 / total)
                                    .setScale(1, RoundingMode.HALF_UP).doubleValue();
                    return new GoalProgressRow(goal.getId(), goal.getTitle(), goal.getStatus(),
                            total, done, percent);
                })
                .toList();
    }

    public List<KpiProgressRow> kpisProgress() {
        List<StrategicGoal> goals = goalRepository.findAll(Sort.by(Sort.Direction.ASC, "title"));
        return goals.stream()
                .flatMap(goal -> goal.getKpis().stream().map(kpi -> toKpiRow(goal, kpi)))
                .toList();
    }

    private KpiProgressRow toKpiRow(StrategicGoal goal, Kpi kpi) {
        BigDecimal target = kpi.getTargetValue() == null ? BigDecimal.ZERO : kpi.getTargetValue();
        BigDecimal current = kpi.getCurrentValue() == null ? BigDecimal.ZERO : kpi.getCurrentValue();
        double percent = 0.0;
        if (target.signum() > 0) {
            BigDecimal raw = current.multiply(BigDecimal.valueOf(100))
                    .divide(target, 1, RoundingMode.HALF_UP);
            percent = raw.min(PERCENT_CAP).doubleValue();
        }
        return new KpiProgressRow(kpi.getId(), goal.getId(), goal.getTitle(),
                kpi.getName(), current, target, kpi.getUnit(), percent);
    }

    public List<TaskWorkloadRow> taskWorkload() {
        List<Task> tasks = taskRepository.findAll();
        Map<String, Map<TaskStatus, Long>> grouped = tasks.stream().collect(Collectors.groupingBy(
                t -> t.getAssignedTo() == null ? "" : t.getAssignedTo(),
                TreeMap::new,
                Collectors.groupingBy(Task::getStatus, Collectors.counting())));
        return grouped.entrySet().stream()
                .flatMap(e -> e.getValue().entrySet().stream()
                        .map(v -> new TaskWorkloadRow(
                                e.getKey().isEmpty() ? null : e.getKey(),
                                v.getKey(), v.getValue())))
                .sorted(Comparator
                        .comparing((TaskWorkloadRow r) -> r.assignee() == null ? "" : r.assignee())
                        .thenComparing(TaskWorkloadRow::status))
                .toList();
    }

    public List<OverdueTaskRow> overdueTasks() {
        LocalDate today = LocalDate.now();
        return taskRepository.findAll().stream()
                .filter(this::isOverdue)
                .sorted(Comparator.comparing(Task::getDeadline))
                .map(t -> new OverdueTaskRow(
                        t.getId(), t.getTitle(),
                        t.getGoal().getId(), t.getGoal().getTitle(),
                        t.getAssignedTo(), t.getDeadline(),
                        ChronoUnit.DAYS.between(t.getDeadline(), today),
                        t.getStatus(), t.getPriority()))
                .toList();
    }

    public List<BacklogThroughputRow> backlogThroughput() {
        Map<String, long[]> buckets = new TreeMap<>();
        for (Backlog b : backlogRepository.findAll()) {
            if (b.getStatus() != BacklogStatus.SIGNED || b.getSignedAt() == null) continue;
            String key = b.getSignedAt().atOffset(ZoneOffset.UTC).format(MONTH_KEY);
            long[] acc = buckets.computeIfAbsent(key, k -> new long[2]);
            acc[0] += 1;
            acc[1] += b.getItems().size();
        }
        return buckets.entrySet().stream()
                .map(e -> new BacklogThroughputRow(e.getKey(), e.getValue()[0], e.getValue()[1]))
                .toList();
    }

    private boolean isOverdue(Task task) {
        return task.getStatus() != TaskStatus.DONE
                && task.getDeadline() != null
                && task.getDeadline().isBefore(LocalDate.now());
    }
}
