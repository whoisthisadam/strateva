package com.strateva.report.service;

import com.strateva.backlog.domain.Backlog;
import com.strateva.backlog.domain.BacklogItem;
import com.strateva.backlog.domain.BacklogRepository;
import com.strateva.backlog.domain.BacklogStatus;
import com.strateva.goal.domain.GoalStatus;
import com.strateva.goal.domain.Kpi;
import com.strateva.goal.domain.Priority;
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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Sort;

import java.lang.reflect.Field;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link ReportService}: verifies percent rounding, null-safe
 * grouping, overdue filtering, and month-bucketed backlog throughput.
 */
class ReportServiceTest {

    private StrategicGoalRepository goalRepository;
    private TaskRepository taskRepository;
    private BacklogRepository backlogRepository;
    private ReportService service;

    @BeforeEach
    void setUp() {
        goalRepository = mock(StrategicGoalRepository.class);
        taskRepository = mock(TaskRepository.class);
        backlogRepository = mock(BacklogRepository.class);
        service = new ReportService(goalRepository, taskRepository, backlogRepository);
    }

    @Test
    void overview_countsEverythingFromRepositories() throws Exception {
        StrategicGoal active = goal(GoalStatus.ACTIVE, "А");
        StrategicGoal draft = goal(GoalStatus.DRAFT, "Б");
        Task done = task(active, TaskStatus.DONE, "emp", null);
        Task overdue = task(active, TaskStatus.IN_PROGRESS, "emp", LocalDate.now().minusDays(2));
        Task fresh = task(active, TaskStatus.TODO, null, LocalDate.now().plusDays(5));
        when(goalRepository.findAll()).thenReturn(List.of(active, draft));
        when(taskRepository.findAll()).thenReturn(List.of(done, overdue, fresh));
        when(backlogRepository.findAll()).thenReturn(List.of(backlog(active, BacklogStatus.SIGNED, Instant.now(), 0)));

        ReportsOverview overview = service.overview("pm");
        assertThat(overview.generatedBy()).isEqualTo("pm");
        assertThat(overview.goalsTotal()).isEqualTo(2);
        assertThat(overview.goalsActive()).isEqualTo(1);
        assertThat(overview.tasksTotal()).isEqualTo(3);
        assertThat(overview.tasksDone()).isEqualTo(1);
        assertThat(overview.tasksOverdue()).isEqualTo(1);
        assertThat(overview.backlogsSigned()).isEqualTo(1);
    }

    @Test
    void goalsProgress_computesPercentRounded() throws Exception {
        StrategicGoal a = goal(GoalStatus.ACTIVE, "А");
        StrategicGoal b = goal(GoalStatus.DRAFT, "Б");
        when(goalRepository.findAll(any(Sort.class))).thenReturn(List.of(a, b));
        when(taskRepository.findAll()).thenReturn(List.of(
                task(a, TaskStatus.DONE, "emp", null),
                task(a, TaskStatus.DONE, "emp", null),
                task(a, TaskStatus.IN_PROGRESS, "emp", null)));
        List<GoalProgressRow> rows = service.goalsProgress();
        assertThat(rows).hasSize(2);
        assertThat(rows.get(0).totalTasks()).isEqualTo(3);
        assertThat(rows.get(0).doneTasks()).isEqualTo(2);
        assertThat(rows.get(0).percent()).isEqualTo(66.7);
        assertThat(rows.get(1).totalTasks()).isZero();
        assertThat(rows.get(1).percent()).isZero();
    }

    @Test
    void kpisProgress_flattensAndClamps() throws Exception {
        StrategicGoal g = goal(GoalStatus.ACTIVE, "А");
        addKpi(g, "KPI-1", new BigDecimal("10.0"), new BigDecimal("5.0"), "шт.");
        addKpi(g, "KPI-2", new BigDecimal("0.0"), new BigDecimal("0.0"), "%");
        when(goalRepository.findAll(any(Sort.class))).thenReturn(List.of(g));
        List<KpiProgressRow> rows = service.kpisProgress();
        assertThat(rows).hasSize(2);
        assertThat(rows.get(0).percent()).isEqualTo(50.0);
        assertThat(rows.get(1).percent()).isZero();
    }

    @Test
    void taskWorkload_groupsByAssigneeAndStatus_nullAssigneeIsReported() throws Exception {
        StrategicGoal g = goal(GoalStatus.ACTIVE, "А");
        when(taskRepository.findAll()).thenReturn(List.of(
                task(g, TaskStatus.TODO, null, null),
                task(g, TaskStatus.TODO, "emp", null),
                task(g, TaskStatus.DONE, "emp", null)));
        List<TaskWorkloadRow> rows = service.taskWorkload();
        assertThat(rows).extracting(TaskWorkloadRow::assignee)
                .containsExactly(null, "emp", "emp");
    }

    @Test
    void overdueTasks_skipsDoneAndFuture() throws Exception {
        StrategicGoal g = goal(GoalStatus.ACTIVE, "А");
        when(taskRepository.findAll()).thenReturn(List.of(
                task(g, TaskStatus.IN_PROGRESS, "emp", LocalDate.now().minusDays(3)),
                task(g, TaskStatus.DONE, "emp", LocalDate.now().minusDays(10)),
                task(g, TaskStatus.TODO, "emp", LocalDate.now().plusDays(5))));
        List<OverdueTaskRow> rows = service.overdueTasks();
        assertThat(rows).hasSize(1);
        assertThat(rows.get(0).daysOverdue()).isEqualTo(3);
    }

    @Test
    void backlogThroughput_groupsByMonth() throws Exception {
        StrategicGoal g = goal(GoalStatus.ACTIVE, "А");
        Instant jan = LocalDate.of(2026, 1, 15).atStartOfDay().toInstant(ZoneOffset.UTC);
        Instant feb = LocalDate.of(2026, 2, 3).atStartOfDay().toInstant(ZoneOffset.UTC);
        when(backlogRepository.findAll()).thenReturn(List.of(
                backlog(g, BacklogStatus.SIGNED, jan, 2),
                backlog(g, BacklogStatus.SIGNED, jan, 1),
                backlog(g, BacklogStatus.SIGNED, feb, 3),
                backlog(g, BacklogStatus.DRAFT, null, 5)));
        List<BacklogThroughputRow> rows = service.backlogThroughput();
        assertThat(rows).extracting(BacklogThroughputRow::period)
                .containsExactly("2026-01", "2026-02");
        assertThat(rows.get(0).signedCount()).isEqualTo(2);
        assertThat(rows.get(0).itemCount()).isEqualTo(3);
        assertThat(rows.get(1).signedCount()).isEqualTo(1);
    }

    private StrategicGoal goal(GoalStatus status, String title) throws Exception {
        StrategicGoal g = new StrategicGoal(title, "d",
                LocalDate.of(2026, 1, 1), LocalDate.of(2026, 12, 31), Priority.HIGH);
        g.setStatus(status);
        setField(g, "id", UUID.randomUUID());
        return g;
    }

    private Task task(StrategicGoal g, TaskStatus status, String assignee, LocalDate deadline) throws Exception {
        Task t = new Task("T", "d", g, null, Priority.MEDIUM, deadline);
        t.setStatus(status);
        t.setAssignedTo(assignee);
        setField(t, "id", UUID.randomUUID());
        return t;
    }

    private void addKpi(StrategicGoal g, String name, BigDecimal target, BigDecimal current, String unit)
            throws Exception {
        Kpi kpi = new Kpi(name, target, current, unit);
        setField(kpi, "id", UUID.randomUUID());
        g.addKpi(kpi);
    }

    private Backlog backlog(StrategicGoal g, BacklogStatus status, Instant signedAt, int items) throws Exception {
        Backlog b = new Backlog("B", g);
        b.setStatus(status);
        b.setSignedAt(signedAt);
        setField(b, "id", UUID.randomUUID());
        for (int i = 0; i < items; i++) {
            BacklogItem item = new BacklogItem("I" + i, "d", Priority.LOW);
            setField(item, "id", UUID.randomUUID());
            b.addItem(item);
        }
        return b;
    }

    private void setField(Object target, String name, Object value) throws Exception {
        Class<?> c = target.getClass();
        while (c != null) {
            try {
                Field f = c.getDeclaredField(name);
                f.setAccessible(true);
                f.set(target, value);
                return;
            } catch (NoSuchFieldException ignored) {
                c = c.getSuperclass();
            }
        }
        throw new NoSuchFieldException(name);
    }
}

