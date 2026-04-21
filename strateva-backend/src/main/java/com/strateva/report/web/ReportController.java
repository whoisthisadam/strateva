package com.strateva.report.web;

import com.strateva.report.service.ReportService;
import com.strateva.report.web.dto.BacklogThroughputRow;
import com.strateva.report.web.dto.GoalProgressRow;
import com.strateva.report.web.dto.KpiProgressRow;
import com.strateva.report.web.dto.OverdueTaskRow;
import com.strateva.report.web.dto.ReportResponse;
import com.strateva.report.web.dto.ReportsOverview;
import com.strateva.report.web.dto.TaskWorkloadRow;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.util.List;

/**
 * PM-only reporting surface for Phase 7. Each aggregated endpoint supports
 * {@code ?format=csv} which streams a UTF-8 BOM'd, Excel-compatible file.
 * Role gating is declared at the class level; BA/EMPLOYEE receive 403.
 */
@RestController
@RequestMapping("/api/v1/reports")
@PreAuthorize("hasRole('PROJECT_MANAGER')")
public class ReportController {

    private static final String CSV_MIME = "text/csv; charset=UTF-8";

    private final ReportService service;

    public ReportController(ReportService service) {
        this.service = service;
    }

    @GetMapping("/overview")
    public ResponseEntity<ReportsOverview> overview() {
        return ResponseEntity.ok(service.overview(currentActor()));
    }

    @GetMapping("/goals-progress")
    public ResponseEntity<?> goalsProgress(@RequestParam(required = false) String format) {
        List<GoalProgressRow> rows = service.goalsProgress();
        if (isCsv(format)) {
            return csv("goals-progress.csv",
                    CsvWriter.write(
                            List.of("goalId", "title", "status", "totalTasks", "doneTasks", "percent"),
                            rows,
                            r -> List.of(r.goalId(), r.title(), r.status(),
                                    r.totalTasks(), r.doneTasks(), r.percent())));
        }
        return ResponseEntity.ok(ReportResponse.of(currentActor(), rows));
    }

    @GetMapping("/kpis-progress")
    public ResponseEntity<?> kpisProgress(@RequestParam(required = false) String format) {
        List<KpiProgressRow> rows = service.kpisProgress();
        if (isCsv(format)) {
            return csv("kpis-progress.csv",
                    CsvWriter.write(
                            List.of("kpiId", "goalId", "goalTitle", "name", "currentValue",
                                    "targetValue", "unit", "percent"),
                            rows,
                            r -> List.of(r.kpiId(), r.goalId(), r.goalTitle(), r.name(),
                                    r.currentValue(), r.targetValue(),
                                    r.unit() == null ? "" : r.unit(), r.percent())));
        }
        return ResponseEntity.ok(ReportResponse.of(currentActor(), rows));
    }

    @GetMapping("/task-workload")
    public ResponseEntity<?> taskWorkload(@RequestParam(required = false) String format) {
        List<TaskWorkloadRow> rows = service.taskWorkload();
        if (isCsv(format)) {
            return csv("task-workload.csv",
                    CsvWriter.write(
                            List.of("assignee", "status", "count"),
                            rows,
                            r -> List.of(r.assignee() == null ? "" : r.assignee(),
                                    r.status(), r.count())));
        }
        return ResponseEntity.ok(ReportResponse.of(currentActor(), rows));
    }

    @GetMapping("/overdue-tasks")
    public ResponseEntity<?> overdueTasks(@RequestParam(required = false) String format) {
        List<OverdueTaskRow> rows = service.overdueTasks();
        if (isCsv(format)) {
            return csv("overdue-tasks.csv",
                    CsvWriter.write(
                            List.of("taskId", "title", "goalId", "goalTitle", "assignee",
                                    "deadline", "daysOverdue", "status", "priority"),
                            rows,
                            r -> List.of(r.taskId(), r.title(), r.goalId(), r.goalTitle(),
                                    r.assignee() == null ? "" : r.assignee(),
                                    r.deadline(), r.daysOverdue(),
                                    r.status(), r.priority())));
        }
        return ResponseEntity.ok(ReportResponse.of(currentActor(), rows));
    }

    @GetMapping("/backlog-throughput")
    public ResponseEntity<?> backlogThroughput(@RequestParam(required = false) String format) {
        List<BacklogThroughputRow> rows = service.backlogThroughput();
        if (isCsv(format)) {
            return csv("backlog-throughput.csv",
                    CsvWriter.write(
                            List.of("period", "signedCount", "itemCount"),
                            rows,
                            r -> List.of(r.period(), r.signedCount(), r.itemCount())));
        }
        return ResponseEntity.ok(ReportResponse.of(currentActor(), rows));
    }

    private static boolean isCsv(String format) {
        return format != null && format.equalsIgnoreCase("csv");
    }

    private static ResponseEntity<byte[]> csv(String filename, String body) {
        byte[] payload = body.getBytes(StandardCharsets.UTF_8);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(CSV_MIME))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + filename + "\"")
                .body(payload);
    }

    private static String currentActor() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth == null ? null : auth.getName();
    }
}
