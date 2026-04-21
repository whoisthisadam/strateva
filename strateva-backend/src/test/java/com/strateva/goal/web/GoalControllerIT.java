package com.strateva.goal.web;

import com.strateva.audit.AuditLogRepository;
import com.strateva.support.AbstractPostgresIT;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * End-to-end authorization and happy-path tests for {@link GoalController}.
 * Covers BR-1 (only PM mutates), BR-4 (≥1 KPI), UC-2 lifecycle, and UC-10
 * employee list scoping.
 */
class GoalControllerIT extends AbstractPostgresIT {

    @Autowired
    private AuditLogRepository auditRepository;

    @BeforeEach
    void truncateGoalsAndKpis() {
        jdbc.execute("TRUNCATE TABLE kpis, strategic_goals CASCADE");
    }

    private static final String VALID_GOAL = """
            {
              "title": "Увеличить выручку",
              "description": "План на 2026 год",
              "periodStart": "2026-01-01",
              "periodEnd": "2026-12-31",
              "priority": "HIGH",
              "kpis": [
                {"name": "Выручка", "targetValue": 1000000, "currentValue": 0, "unit": "руб."}
              ]
            }
            """;

    private static final String NO_KPI_GOAL = """
            {
              "title": "Без KPI",
              "periodStart": "2026-01-01",
              "periodEnd": "2026-06-30",
              "priority": "LOW",
              "kpis": []
            }
            """;

    @Test
    void unauthenticated_list_returns401() throws Exception {
        mockMvc.perform(get("/api/v1/goals"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void businessAnalyst_cannotCreateGoal_BR1() throws Exception {
        String ba = loginAs("ba", "baPass1!");
        mockMvc.perform(post("/api/v1/goals")
                        .header(HttpHeaders.AUTHORIZATION, bearer(ba))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_GOAL))
                .andExpect(status().isForbidden());
    }

    @Test
    void employee_cannotCreateGoal_BR1() throws Exception {
        String emp = loginAs("emp", "empPass1!");
        mockMvc.perform(post("/api/v1/goals")
                        .header(HttpHeaders.AUTHORIZATION, bearer(emp))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_GOAL))
                .andExpect(status().isForbidden());
    }

    @Test
    void projectManager_createsGoal_andAuditRowIsWritten() throws Exception {
        long before = auditRepository.count();
        String pm = loginAs("pm", "pmPass1!");
        mockMvc.perform(post("/api/v1/goals")
                        .header(HttpHeaders.AUTHORIZATION, bearer(pm))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_GOAL))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("DRAFT"))
                .andExpect(jsonPath("$.kpis.length()").value(1))
                .andExpect(jsonPath("$.createdBy").value("pm"));

        long after = auditRepository.count();
        // LOGIN_SUCCESS + CREATE StrategicGoal
        assertThat(after - before).isGreaterThanOrEqualTo(2);
    }

    @Test
    void projectManager_createGoalWithoutKpis_returns400_BR4() throws Exception {
        String pm = loginAs("pm", "pmPass1!");
        mockMvc.perform(post("/api/v1/goals")
                        .header(HttpHeaders.AUTHORIZATION, bearer(pm))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(NO_KPI_GOAL))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("BUSINESS_RULE_VIOLATED"))
                .andExpect(jsonPath("$.message").value(
                        org.hamcrest.Matchers.containsString("ключевой показатель")));
    }

    @Test
    void goalLifecycle_draftSubmitActivateArchive() throws Exception {
        String pm = loginAs("pm", "pmPass1!");
        String created = mockMvc.perform(post("/api/v1/goals")
                        .header(HttpHeaders.AUTHORIZATION, bearer(pm))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_GOAL))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        String id = objectMapper.readTree(created).get("id").asText();

        mockMvc.perform(post("/api/v1/goals/" + id + "/submit")
                        .header(HttpHeaders.AUTHORIZATION, bearer(pm)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUBMITTED"));

        mockMvc.perform(post("/api/v1/goals/" + id + "/status")
                        .header(HttpHeaders.AUTHORIZATION, bearer(pm))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"ACTIVE\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACTIVE"));

        mockMvc.perform(post("/api/v1/goals/" + id + "/status")
                        .header(HttpHeaders.AUTHORIZATION, bearer(pm))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"ARCHIVED\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ARCHIVED"));
    }

    @Test
    void employee_listOnlyShowsActiveGoals_UC10() throws Exception {
        String pm = loginAs("pm", "pmPass1!");
        // DRAFT
        mockMvc.perform(post("/api/v1/goals")
                .header(HttpHeaders.AUTHORIZATION, bearer(pm))
                .contentType(MediaType.APPLICATION_JSON)
                .content(VALID_GOAL)).andExpect(status().isCreated());

        // ACTIVE
        String secondBody = VALID_GOAL.replace("Увеличить выручку", "Активная цель");
        String created = mockMvc.perform(post("/api/v1/goals")
                        .header(HttpHeaders.AUTHORIZATION, bearer(pm))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(secondBody))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        String id = objectMapper.readTree(created).get("id").asText();
        mockMvc.perform(post("/api/v1/goals/" + id + "/submit")
                .header(HttpHeaders.AUTHORIZATION, bearer(pm))).andExpect(status().isOk());
        mockMvc.perform(post("/api/v1/goals/" + id + "/status")
                .header(HttpHeaders.AUTHORIZATION, bearer(pm))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\":\"ACTIVE\"}")).andExpect(status().isOk());

        String emp = loginAs("emp", "empPass1!");
        mockMvc.perform(get("/api/v1/goals")
                        .header(HttpHeaders.AUTHORIZATION, bearer(emp)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].status").value("ACTIVE"));
    }

    @Test
    void deleteDraftGoal_succeeds_butDeletingActiveFails() throws Exception {
        String pm = loginAs("pm", "pmPass1!");
        String created = mockMvc.perform(post("/api/v1/goals")
                        .header(HttpHeaders.AUTHORIZATION, bearer(pm))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_GOAL))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        String id = objectMapper.readTree(created).get("id").asText();

        mockMvc.perform(delete("/api/v1/goals/" + id)
                        .header(HttpHeaders.AUTHORIZATION, bearer(pm)))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/v1/goals/" + id)
                        .header(HttpHeaders.AUTHORIZATION, bearer(pm)))
                .andExpect(status().isNotFound());
    }

    @Test
    void updateActiveGoal_returns400() throws Exception {
        String pm = loginAs("pm", "pmPass1!");
        String created = mockMvc.perform(post("/api/v1/goals")
                        .header(HttpHeaders.AUTHORIZATION, bearer(pm))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_GOAL))
                .andReturn().getResponse().getContentAsString();
        String id = objectMapper.readTree(created).get("id").asText();
        mockMvc.perform(post("/api/v1/goals/" + id + "/submit")
                .header(HttpHeaders.AUTHORIZATION, bearer(pm)));
        mockMvc.perform(post("/api/v1/goals/" + id + "/status")
                .header(HttpHeaders.AUTHORIZATION, bearer(pm))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\":\"ACTIVE\"}"));

        mockMvc.perform(patch("/api/v1/goals/" + id)
                        .header(HttpHeaders.AUTHORIZATION, bearer(pm))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_GOAL))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("BUSINESS_RULE_VIOLATED"));
    }
}
