package com.strateva.report.web;

import com.strateva.support.AbstractPostgresIT;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * PM-only authorization gate + CSV/JSON content negotiation for {@link ReportController}.
 * Exercises every endpoint against a seeded goal → task fixture so the
 * aggregated numbers are non-trivial.
 */
class ReportControllerIT extends AbstractPostgresIT {

    @BeforeEach
    void truncate() {
        jdbc.execute("TRUNCATE TABLE tasks, backlog_items, backlogs, kpis, strategic_goals CASCADE");
    }

    private static final String GOAL = """
            {"title":"Отчётная цель","periodStart":"2026-01-01","periodEnd":"2026-12-31","priority":"HIGH",
             "kpis":[{"name":"Выручка","targetValue":1000,"currentValue":250,"unit":"руб."}]}
            """;

    private String activateGoal(String pm) throws Exception {
        MvcResult created = mockMvc.perform(post("/api/v1/goals")
                        .header(HttpHeaders.AUTHORIZATION, bearer(pm))
                        .contentType(MediaType.APPLICATION_JSON).content(GOAL))
                .andExpect(status().isCreated()).andReturn();
        String id = objectMapper.readTree(created.getResponse().getContentAsString()).get("id").asText();
        mockMvc.perform(post("/api/v1/goals/" + id + "/submit")
                .header(HttpHeaders.AUTHORIZATION, bearer(pm))).andExpect(status().isOk());
        mockMvc.perform(post("/api/v1/goals/" + id + "/status")
                .header(HttpHeaders.AUTHORIZATION, bearer(pm))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\":\"ACTIVE\"}")).andExpect(status().isOk());
        return id;
    }

    private String createTask(String pm, String goalId) throws Exception {
        String body = """
                {"title":"T","description":"d","goalId":"%s","priority":"HIGH"}
                """.formatted(goalId);
        MvcResult res = mockMvc.perform(post("/api/v1/tasks")
                        .header(HttpHeaders.AUTHORIZATION, bearer(pm))
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated()).andReturn();
        return objectMapper.readTree(res.getResponse().getContentAsString()).get("id").asText();
    }

    @Test
    void unauthenticated_returns401() throws Exception {
        mockMvc.perform(get("/api/v1/reports/overview")).andExpect(status().isUnauthorized());
    }

    @Test
    void businessAnalyst_andEmployee_areForbidden() throws Exception {
        String ba = loginAs("ba", "baPass1!");
        String emp = loginAs("emp", "empPass1!");
        for (String path : java.util.List.of(
                "/api/v1/reports/overview",
                "/api/v1/reports/goals-progress",
                "/api/v1/reports/kpis-progress",
                "/api/v1/reports/task-workload",
                "/api/v1/reports/overdue-tasks",
                "/api/v1/reports/backlog-throughput")) {
            mockMvc.perform(get(path).header(HttpHeaders.AUTHORIZATION, bearer(ba)))
                    .andExpect(status().isForbidden());
            mockMvc.perform(get(path).header(HttpHeaders.AUTHORIZATION, bearer(emp)))
                    .andExpect(status().isForbidden());
        }
    }

    @Test
    void overview_reflectsSeededCounts() throws Exception {
        String pm = loginAs("pm", "pmPass1!");
        String goalId = activateGoal(pm);
        createTask(pm, goalId);
        mockMvc.perform(get("/api/v1/reports/overview")
                        .header(HttpHeaders.AUTHORIZATION, bearer(pm)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.goalsTotal").value(1))
                .andExpect(jsonPath("$.goalsActive").value(1))
                .andExpect(jsonPath("$.tasksTotal").value(1))
                .andExpect(jsonPath("$.generatedBy").value("pm"));
    }

    @Test
    void goalsProgress_returnsJsonByDefault() throws Exception {
        String pm = loginAs("pm", "pmPass1!");
        activateGoal(pm);
        mockMvc.perform(get("/api/v1/reports/goals-progress")
                        .header(HttpHeaders.AUTHORIZATION, bearer(pm)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.generatedBy").value("pm"))
                .andExpect(jsonPath("$.rows[0].title").value("Отчётная цель"))
                .andExpect(jsonPath("$.rows[0].totalTasks").value(0));
    }

    @Test
    void kpisProgress_csv_hasBomAndAttachmentDisposition() throws Exception {
        String pm = loginAs("pm", "pmPass1!");
        activateGoal(pm);
        MvcResult res = mockMvc.perform(get("/api/v1/reports/kpis-progress?format=csv")
                        .header(HttpHeaders.AUTHORIZATION, bearer(pm)))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION,
                        org.hamcrest.Matchers.containsString("kpis-progress.csv")))
                .andExpect(content().contentTypeCompatibleWith("text/csv"))
                .andReturn();
        byte[] body = res.getResponse().getContentAsByteArray();
        assertThat(body.length).isGreaterThan(3);
        assertThat(body[0] & 0xFF).isEqualTo(0xEF);
        assertThat(body[1] & 0xFF).isEqualTo(0xBB);
        assertThat(body[2] & 0xFF).isEqualTo(0xBF);
        String text = new String(body, java.nio.charset.StandardCharsets.UTF_8);
        assertThat(text).contains("Выручка").contains("руб.");
    }

    @Test
    void taskWorkload_overdue_throughput_returnOkForPm() throws Exception {
        String pm = loginAs("pm", "pmPass1!");
        activateGoal(pm);
        for (String path : java.util.List.of(
                "/api/v1/reports/task-workload",
                "/api/v1/reports/overdue-tasks",
                "/api/v1/reports/backlog-throughput")) {
            mockMvc.perform(get(path).header(HttpHeaders.AUTHORIZATION, bearer(pm)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.generatedBy").value("pm"));
        }
    }
}
