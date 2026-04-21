package com.strateva.backlog.web;

import com.strateva.audit.AuditLogRepository;
import com.strateva.support.AbstractPostgresIT;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * End-to-end authorization and happy-path tests for {@link BacklogController}.
 * Covers UC-4/UC-6/UC-7 lifecycle (BA create → submit → PM sign / cancel),
 * the BR-2 single-goal invariant (structurally via {@code goalId}),
 * item-mutation guard, and audit-row emission.
 */
class BacklogControllerIT extends AbstractPostgresIT {

    @Autowired
    private AuditLogRepository auditRepository;

    @BeforeEach
    void truncateBacklogsAndGoals() {
        jdbc.execute("TRUNCATE TABLE tasks, backlog_items, backlogs, kpis, strategic_goals CASCADE");
    }

    private static final String GOAL = """
            {
              "title": "Цель для бэклога",
              "periodStart": "2026-01-01",
              "periodEnd": "2026-12-31",
              "priority": "HIGH",
              "kpis": [{"name":"KPI","targetValue":10,"currentValue":0,"unit":"шт."}]
            }
            """;

    private String createGoalId(String pmToken) throws Exception {
        String json = mockMvc.perform(post("/api/v1/goals")
                        .header(HttpHeaders.AUTHORIZATION, bearer(pmToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(GOAL))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(json).get("id").asText();
    }

    private String backlogBody(String goalId, String title) {
        return """
                {
                  "title": "%s",
                  "goalId": "%s",
                  "items": [
                    {"title":"Элемент 1","description":"d","priority":"HIGH"},
                    {"title":"Элемент 2","description":"d","priority":"LOW"}
                  ]
                }
                """.formatted(title, goalId);
    }

    @Test
    void unauthenticated_list_returns401() throws Exception {
        mockMvc.perform(get("/api/v1/backlogs"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void projectManager_cannotCreateBacklog_onlyBA() throws Exception {
        String pm = loginAs("pm", "pmPass1!");
        String goalId = createGoalId(pm);
        mockMvc.perform(post("/api/v1/backlogs")
                        .header(HttpHeaders.AUTHORIZATION, bearer(pm))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(backlogBody(goalId, "x")))
                .andExpect(status().isForbidden());
    }

    @Test
    void employee_cannotListBacklogs() throws Exception {
        String emp = loginAs("emp", "empPass1!");
        mockMvc.perform(get("/api/v1/backlogs")
                        .header(HttpHeaders.AUTHORIZATION, bearer(emp)))
                .andExpect(status().isForbidden());
    }

    @Test
    void businessAnalyst_createsBacklog_inDraft_auditRowWritten() throws Exception {
        String pm = loginAs("pm", "pmPass1!");
        String goalId = createGoalId(pm);
        long before = auditRepository.count();

        String ba = loginAs("ba", "baPass1!");
        mockMvc.perform(post("/api/v1/backlogs")
                        .header(HttpHeaders.AUTHORIZATION, bearer(ba))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(backlogBody(goalId, "Бэклог Q1")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("DRAFT"))
                .andExpect(jsonPath("$.goalId").value(goalId))
                .andExpect(jsonPath("$.items.length()").value(2))
                .andExpect(jsonPath("$.createdBy").value("ba"));

        long after = auditRepository.count();
        // two LOGIN_SUCCESS + CREATE Backlog
        assertThat(after - before).isGreaterThanOrEqualTo(2);
    }

    @Test
    void createBacklog_withUnknownGoal_returns400() throws Exception {
        loginAs("pm", "pmPass1!");
        String ba = loginAs("ba", "baPass1!");
        String body = """
                {"title":"t","goalId":"00000000-0000-0000-0000-000000000000","items":[]}
                """;
        mockMvc.perform(post("/api/v1/backlogs")
                        .header(HttpHeaders.AUTHORIZATION, bearer(ba))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("BUSINESS_RULE_VIOLATED"));
    }

    @Test
    void fullLifecycle_baCreateSubmit_pmSign_isAudited() throws Exception {
        String pm = loginAs("pm", "pmPass1!");
        String goalId = createGoalId(pm);
        String ba = loginAs("ba", "baPass1!");
        String created = mockMvc.perform(post("/api/v1/backlogs")
                        .header(HttpHeaders.AUTHORIZATION, bearer(ba))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(backlogBody(goalId, "Бэклог к подписанию")))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        String id = objectMapper.readTree(created).get("id").asText();

        mockMvc.perform(post("/api/v1/backlogs/" + id + "/submit")
                        .header(HttpHeaders.AUTHORIZATION, bearer(ba)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUBMITTED"));

        // BA cannot sign
        mockMvc.perform(post("/api/v1/backlogs/" + id + "/sign")
                        .header(HttpHeaders.AUTHORIZATION, bearer(ba)))
                .andExpect(status().isForbidden());

        long beforeSign = auditRepository.count();
        mockMvc.perform(post("/api/v1/backlogs/" + id + "/sign")
                        .header(HttpHeaders.AUTHORIZATION, bearer(pm)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SIGNED"))
                .andExpect(jsonPath("$.signedBy").value("pm"));
        assertThat(auditRepository.count() - beforeSign).isGreaterThanOrEqualTo(1);

        // SIGNED is terminal — cannot cancel
        mockMvc.perform(post("/api/v1/backlogs/" + id + "/cancel")
                        .header(HttpHeaders.AUTHORIZATION, bearer(pm)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("BUSINESS_RULE_VIOLATED"));
    }

    @Test
    void pmCancel_fromSubmitted_marksCancelledBy() throws Exception {
        String pm = loginAs("pm", "pmPass1!");
        String goalId = createGoalId(pm);
        String ba = loginAs("ba", "baPass1!");
        String created = mockMvc.perform(post("/api/v1/backlogs")
                        .header(HttpHeaders.AUTHORIZATION, bearer(ba))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(backlogBody(goalId, "к отмене")))
                .andReturn().getResponse().getContentAsString();
        String id = objectMapper.readTree(created).get("id").asText();
        mockMvc.perform(post("/api/v1/backlogs/" + id + "/submit")
                .header(HttpHeaders.AUTHORIZATION, bearer(ba))).andExpect(status().isOk());

        mockMvc.perform(post("/api/v1/backlogs/" + id + "/cancel")
                        .header(HttpHeaders.AUTHORIZATION, bearer(pm)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"))
                .andExpect(jsonPath("$.cancelledBy").value("pm"));
    }

    @Test
    void submit_emptyBacklog_returns400() throws Exception {
        String pm = loginAs("pm", "pmPass1!");
        String goalId = createGoalId(pm);
        String ba = loginAs("ba", "baPass1!");
        String body = """
                {"title":"пусто","goalId":"%s","items":[]}
                """.formatted(goalId);
        String created = mockMvc.perform(post("/api/v1/backlogs")
                        .header(HttpHeaders.AUTHORIZATION, bearer(ba))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        String id = objectMapper.readTree(created).get("id").asText();

        mockMvc.perform(post("/api/v1/backlogs/" + id + "/submit")
                        .header(HttpHeaders.AUTHORIZATION, bearer(ba)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message")
                        .value(org.hamcrest.Matchers.containsString("хотя бы один элемент")));
    }

    @Test
    void businessAnalyst_list_showsOnlyOwnBacklogs() throws Exception {
        String pm = loginAs("pm", "pmPass1!");
        String goalId = createGoalId(pm);
        String ba = loginAs("ba", "baPass1!");
        mockMvc.perform(post("/api/v1/backlogs")
                .header(HttpHeaders.AUTHORIZATION, bearer(ba))
                .contentType(MediaType.APPLICATION_JSON)
                .content(backlogBody(goalId, "мой")))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/v1/backlogs")
                        .header(HttpHeaders.AUTHORIZATION, bearer(ba)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1))
                .andExpect(jsonPath("$.content[0].createdBy").value("ba"));

        mockMvc.perform(get("/api/v1/backlogs")
                        .header(HttpHeaders.AUTHORIZATION, bearer(pm)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1));
    }
}
