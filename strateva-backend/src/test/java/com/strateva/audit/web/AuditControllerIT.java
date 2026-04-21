package com.strateva.audit.web;

import com.strateva.audit.AuditAction;
import com.strateva.audit.AuditLog;
import com.strateva.audit.AuditLogRepository;
import com.strateva.support.AbstractPostgresIT;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Exercises the authorization matrix and filter combinations for
 * {@link AuditController}. Uses real JWTs issued by {@code /api/v1/auth/login}.
 */
class AuditControllerIT extends AbstractPostgresIT {

    @Autowired
    private AuditLogRepository repository;

    @BeforeEach
    void seedAuditRows() {
        Instant base = Instant.now().minus(1, ChronoUnit.HOURS);
        repository.save(new AuditLog(AuditAction.CREATE, "Goal", "goal-1", "pm", null, "g1"));
        repository.save(new AuditLog(AuditAction.UPDATE, "Goal", "goal-1", "pm", null, "g2"));
        repository.save(new AuditLog(AuditAction.CREATE, "Backlog", "backlog-1", "ba", null, "b1"));
        repository.save(new AuditLog(AuditAction.LOGIN_SUCCESS, "User", "u1", "emp", null, "ok"));
        // touch variable so IDE stops marking it unused
        if (base.isAfter(Instant.EPOCH)) {
            repository.flush();
        }
    }

    @Test
    void unauthenticatedRequestReturns401() throws Exception {
        mockMvc.perform(get("/api/v1/audit"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void businessAnalystIsForbidden() throws Exception {
        String token = loginAs("ba", "baPass1!");
        mockMvc.perform(get("/api/v1/audit").header(HttpHeaders.AUTHORIZATION, bearer(token)))
                .andExpect(status().isForbidden());
    }

    @Test
    void employeeIsForbidden() throws Exception {
        String token = loginAs("emp", "empPass1!");
        mockMvc.perform(get("/api/v1/audit").header(HttpHeaders.AUTHORIZATION, bearer(token)))
                .andExpect(status().isForbidden());
    }

    @Test
    void projectManagerCanListAllRows() throws Exception {
        String token = loginAs("pm", "pmPass1!");
        mockMvc.perform(get("/api/v1/audit").header(HttpHeaders.AUTHORIZATION, bearer(token)))
                .andExpect(status().isOk())
                // 4 seeded rows + 1 LOGIN_SUCCESS for the pm login above
                .andExpect(jsonPath("$.totalElements").value(5));
    }

    @Test
    void filterByEntityTypeReturnsMatchingRowsOnly() throws Exception {
        String token = loginAs("pm", "pmPass1!");
        mockMvc.perform(get("/api/v1/audit")
                        .param("entityType", "Goal")
                        .header(HttpHeaders.AUTHORIZATION, bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(2))
                .andExpect(jsonPath("$.content[0].entityType").value("Goal"));
    }

    @Test
    void filterByPerformedByReturnsMatchingRowsOnly() throws Exception {
        String token = loginAs("pm", "pmPass1!");
        mockMvc.perform(get("/api/v1/audit")
                        .param("performedBy", "ba")
                        .header(HttpHeaders.AUTHORIZATION, bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].actor").value("ba"));
    }

    @Test
    void filterByEntityIdReturnsMatchingRowsOnly() throws Exception {
        String token = loginAs("pm", "pmPass1!");
        mockMvc.perform(get("/api/v1/audit")
                        .param("entityId", "goal-1")
                        .header(HttpHeaders.AUTHORIZATION, bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(2));
    }

    @Test
    void filterByTimeRangeReturnsOnlyRecentRows() throws Exception {
        String token = loginAs("pm", "pmPass1!");
        Instant from = Instant.now().minus(1, ChronoUnit.MINUTES);
        mockMvc.perform(get("/api/v1/audit")
                        .param("from", from.toString())
                        .header(HttpHeaders.AUTHORIZATION, bearer(token)))
                .andExpect(status().isOk())
                // All seeded rows + pm's LOGIN_SUCCESS created within the last minute
                .andExpect(jsonPath("$.totalElements").value(5));
    }

    @Test
    void paginationParametersAreHonoured() throws Exception {
        String token = loginAs("pm", "pmPass1!");
        mockMvc.perform(get("/api/v1/audit")
                        .param("page", "0")
                        .param("size", "2")
                        .header(HttpHeaders.AUTHORIZATION, bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(2))
                .andExpect(jsonPath("$.size").value(2));
    }
}
