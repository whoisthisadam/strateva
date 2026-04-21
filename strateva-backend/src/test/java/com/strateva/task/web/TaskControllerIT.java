package com.strateva.task.web;

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
 * End-to-end tests for {@link TaskController}: authorization gates,
 * BR-3 (status change requires assignee), BR-5 (no tasks on ARCHIVED goals),
 * UC-9 list scoping for EMPLOYEE, audit emission.
 */
class TaskControllerIT extends AbstractPostgresIT {

    @Autowired
    private AuditLogRepository auditRepository;

    @BeforeEach
    void truncate() {
        jdbc.execute("TRUNCATE TABLE tasks, backlog_items, backlogs, kpis, strategic_goals CASCADE");
    }

    private static final String GOAL = """
            {"title":"Цель","periodStart":"2026-01-01","periodEnd":"2026-12-31","priority":"HIGH",
             "kpis":[{"name":"KPI","targetValue":10,"currentValue":0,"unit":"шт."}]}
            """;

    private String createActiveGoal(String pm) throws Exception {
        String created = mockMvc.perform(post("/api/v1/goals")
                        .header(HttpHeaders.AUTHORIZATION, bearer(pm))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(GOAL))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        String id = objectMapper.readTree(created).get("id").asText();
        mockMvc.perform(post("/api/v1/goals/" + id + "/submit")
                .header(HttpHeaders.AUTHORIZATION, bearer(pm))).andExpect(status().isOk());
        mockMvc.perform(post("/api/v1/goals/" + id + "/status")
                .header(HttpHeaders.AUTHORIZATION, bearer(pm))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\":\"ACTIVE\"}")).andExpect(status().isOk());
        return id;
    }

    private String taskBody(String goalId, String title) {
        return """
                {"title":"%s","description":"d","goalId":"%s","priority":"HIGH"}
                """.formatted(title, goalId);
    }

    @Test
    void unauthenticated_list_returns401() throws Exception {
        mockMvc.perform(get("/api/v1/tasks")).andExpect(status().isUnauthorized());
    }

    @Test
    void businessAnalyst_cannotCreateTask() throws Exception {
        String pm = loginAs("pm", "pmPass1!");
        String goalId = createActiveGoal(pm);
        String ba = loginAs("ba", "baPass1!");
        mockMvc.perform(post("/api/v1/tasks")
                        .header(HttpHeaders.AUTHORIZATION, bearer(ba))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(taskBody(goalId, "x")))
                .andExpect(status().isForbidden());
    }

    @Test
    void employee_cannotCreateTask() throws Exception {
        String pm = loginAs("pm", "pmPass1!");
        String goalId = createActiveGoal(pm);
        String emp = loginAs("emp", "empPass1!");
        mockMvc.perform(post("/api/v1/tasks")
                        .header(HttpHeaders.AUTHORIZATION, bearer(emp))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(taskBody(goalId, "x")))
                .andExpect(status().isForbidden());
    }

    @Test
    void projectManager_createsTaskInTodo_auditRowWritten() throws Exception {
        String pm = loginAs("pm", "pmPass1!");
        String goalId = createActiveGoal(pm);
        long before = auditRepository.count();
        mockMvc.perform(post("/api/v1/tasks")
                        .header(HttpHeaders.AUTHORIZATION, bearer(pm))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(taskBody(goalId, "Задача A")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("TODO"))
                .andExpect(jsonPath("$.assignedTo").doesNotExist())
                .andExpect(jsonPath("$.createdBy").value("pm"));
        assertThat(auditRepository.count() - before).isGreaterThanOrEqualTo(1);
    }

    @Test
    void taskOnArchivedGoal_returns400_BR5() throws Exception {
        String pm = loginAs("pm", "pmPass1!");
        String goalId = createActiveGoal(pm);
        mockMvc.perform(post("/api/v1/goals/" + goalId + "/status")
                .header(HttpHeaders.AUTHORIZATION, bearer(pm))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\":\"ARCHIVED\"}")).andExpect(status().isOk());

        mockMvc.perform(post("/api/v1/tasks")
                        .header(HttpHeaders.AUTHORIZATION, bearer(pm))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(taskBody(goalId, "Архивная")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("BUSINESS_RULE_VIOLATED"))
                .andExpect(jsonPath("$.message").value(
                        org.hamcrest.Matchers.containsString("архивной")));
    }

    @Test
    void changeStatus_leavingTodoWithoutAssignee_returns400_BR3() throws Exception {
        String pm = loginAs("pm", "pmPass1!");
        String goalId = createActiveGoal(pm);
        String created = mockMvc.perform(post("/api/v1/tasks")
                        .header(HttpHeaders.AUTHORIZATION, bearer(pm))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(taskBody(goalId, "t")))
                .andReturn().getResponse().getContentAsString();
        String id = objectMapper.readTree(created).get("id").asText();

        mockMvc.perform(post("/api/v1/tasks/" + id + "/status")
                        .header(HttpHeaders.AUTHORIZATION, bearer(pm))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"IN_PROGRESS\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("BUSINESS_RULE_VIOLATED"));
    }

    @Test
    void fullLifecycle_pmCreateAssign_empTransitions_audited() throws Exception {
        String pm = loginAs("pm", "pmPass1!");
        String goalId = createActiveGoal(pm);
        String created = mockMvc.perform(post("/api/v1/tasks")
                        .header(HttpHeaders.AUTHORIZATION, bearer(pm))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(taskBody(goalId, "Задача B")))
                .andReturn().getResponse().getContentAsString();
        String id = objectMapper.readTree(created).get("id").asText();

        mockMvc.perform(post("/api/v1/tasks/" + id + "/assignee")
                        .header(HttpHeaders.AUTHORIZATION, bearer(pm))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"assignee\":\"emp\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.assignedTo").value("emp"));

        String emp = loginAs("emp", "empPass1!");
        // UC-9: employee can move their own task
        mockMvc.perform(post("/api/v1/tasks/" + id + "/status")
                        .header(HttpHeaders.AUTHORIZATION, bearer(emp))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"IN_PROGRESS\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("IN_PROGRESS"));

        long beforeDone = auditRepository.count();
        mockMvc.perform(post("/api/v1/tasks/" + id + "/status")
                        .header(HttpHeaders.AUTHORIZATION, bearer(emp))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"DONE\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("DONE"));
        assertThat(auditRepository.count() - beforeDone).isGreaterThanOrEqualTo(1);

        // DONE is terminal
        mockMvc.perform(post("/api/v1/tasks/" + id + "/status")
                        .header(HttpHeaders.AUTHORIZATION, bearer(emp))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"IN_PROGRESS\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void employee_listScopedToOwnTasks_UC9() throws Exception {
        String pm = loginAs("pm", "pmPass1!");
        String goalId = createActiveGoal(pm);
        String mine = mockMvc.perform(post("/api/v1/tasks")
                        .header(HttpHeaders.AUTHORIZATION, bearer(pm))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(taskBody(goalId, "Моя")))
                .andReturn().getResponse().getContentAsString();
        String mineId = objectMapper.readTree(mine).get("id").asText();
        mockMvc.perform(post("/api/v1/tasks/" + mineId + "/assignee")
                .header(HttpHeaders.AUTHORIZATION, bearer(pm))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"assignee\":\"emp\"}")).andExpect(status().isOk());

        // unassigned task — emp must NOT see it
        mockMvc.perform(post("/api/v1/tasks")
                .header(HttpHeaders.AUTHORIZATION, bearer(pm))
                .contentType(MediaType.APPLICATION_JSON)
                .content(taskBody(goalId, "Чужая"))).andExpect(status().isCreated());

        String emp = loginAs("emp", "empPass1!");
        mockMvc.perform(get("/api/v1/tasks")
                        .header(HttpHeaders.AUTHORIZATION, bearer(emp)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].assignedTo").value("emp"));
    }
}
