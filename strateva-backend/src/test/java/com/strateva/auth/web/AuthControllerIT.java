package com.strateva.auth.web;

import com.strateva.support.AbstractPostgresIT;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * End-to-end coverage of the authentication endpoints (UC-1).
 * Seeded credentials come from {@code UserSeeder}.
 */
class AuthControllerIT extends AbstractPostgresIT {

    @Test
    void projectManagerCanLogInAndFetchCurrentUser() throws Exception {
        String token = loginAs("pm", "pmPass1!");
        mockMvc.perform(get("/api/v1/auth/me")
                        .header(HttpHeaders.AUTHORIZATION, bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("pm"))
                .andExpect(jsonPath("$.role").value("PROJECT_MANAGER"))
                .andExpect(jsonPath("$.fullName").value("Менеджер проектов"));
    }

    @Test
    void businessAnalystCanLogInAndFetchCurrentUser() throws Exception {
        String token = loginAs("ba", "baPass1!");
        mockMvc.perform(get("/api/v1/auth/me")
                        .header(HttpHeaders.AUTHORIZATION, bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("BUSINESS_ANALYST"));
    }

    @Test
    void employeeCanLogInAndFetchCurrentUser() throws Exception {
        String token = loginAs("emp", "empPass1!");
        mockMvc.perform(get("/api/v1/auth/me")
                        .header(HttpHeaders.AUTHORIZATION, bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("EMPLOYEE"));
    }

    @Test
    void wrongPasswordReturns401WithRussianMessage() throws Exception {
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"pm\",\"password\":\"not-it\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("BAD_CREDENTIALS"))
                .andExpect(jsonPath("$.message").value("Неверный логин или пароль"));
    }

    @Test
    void missingUserReturns401() throws Exception {
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"ghost\",\"password\":\"whatever\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void malformedBodyReturns400WithValidationErrors() throws Exception {
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"\",\"password\":\"\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.fieldErrors").isArray())
                .andExpect(jsonPath("$.fieldErrors.length()").value(2));
    }
}
