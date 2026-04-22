package com.strateva.auth.web;

import com.strateva.support.AbstractPostgresIT;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Authorization matrix for {@link UserController}. PM-only endpoint used by
 * the assignee picker (Phase 6) and the admin user list (Phase 8).
 * Seeded users (see {@code UserSeeder}): pm, ba, emp — one per role.
 */
class UserControllerIT extends AbstractPostgresIT {

    @Test
    void unauthenticatedRequestReturns401() throws Exception {
        mockMvc.perform(get("/api/v1/users"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void businessAnalystIsForbidden() throws Exception {
        String token = loginAs("ba", "baPass1!");
        mockMvc.perform(get("/api/v1/users").header(HttpHeaders.AUTHORIZATION, bearer(token)))
                .andExpect(status().isForbidden());
    }

    @Test
    void employeeIsForbidden() throws Exception {
        String token = loginAs("emp", "empPass1!");
        mockMvc.perform(get("/api/v1/users").header(HttpHeaders.AUTHORIZATION, bearer(token)))
                .andExpect(status().isForbidden());
    }

    @Test
    void projectManagerListsAllSeededUsers() throws Exception {
        String token = loginAs("pm", "pmPass1!");
        mockMvc.perform(get("/api/v1/users").header(HttpHeaders.AUTHORIZATION, bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(3));
    }

    @Test
    void projectManagerFiltersByRole() throws Exception {
        String token = loginAs("pm", "pmPass1!");
        mockMvc.perform(get("/api/v1/users")
                        .param("role", "EMPLOYEE")
                        .header(HttpHeaders.AUTHORIZATION, bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].username").value("emp"))
                .andExpect(jsonPath("$[0].role").value("EMPLOYEE"));
    }
}
