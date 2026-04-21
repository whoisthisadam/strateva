package com.strateva.auth;

import com.strateva.audit.AuditAction;
import com.strateva.audit.AuditLog;
import com.strateva.audit.AuditLogRepository;
import com.strateva.support.AbstractPostgresIT;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Verifies that authentication attempts emit {@link AuditAction#LOGIN_SUCCESS} /
 * {@link AuditAction#LOGIN_FAILURE} audit rows (BR-8) and that those rows are
 * readable through {@code /api/v1/audit} for project managers.
 */
class AuthAuditIT extends AbstractPostgresIT {

    @Autowired
    private AuditLogRepository repository;

    @Test
    void successfulLoginWritesLoginSuccessAuditRow() throws Exception {
        loginAs("pm", "pmPass1!");

        List<AuditLog> rows = repository.findAll();
        assertThat(rows).hasSize(1);
        AuditLog entry = rows.get(0);
        assertThat(entry.getAction()).isEqualTo(AuditAction.LOGIN_SUCCESS);
        assertThat(entry.getActor()).isEqualTo("pm");
        assertThat(entry.getEntityType()).isEqualTo("User");
        assertThat(entry.getMessage()).isEqualTo("Успешный вход в систему");
    }

    @Test
    void failedLoginWritesLoginFailureAuditRow() throws Exception {
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"pm\",\"password\":\"wrong\"}"))
                .andExpect(status().isUnauthorized());

        List<AuditLog> rows = repository.findAll();
        assertThat(rows).hasSize(1);
        AuditLog entry = rows.get(0);
        assertThat(entry.getAction()).isEqualTo(AuditAction.LOGIN_FAILURE);
        assertThat(entry.getActor()).isEqualTo("pm");
        assertThat(entry.getMessage()).isEqualTo("Неверный логин или пароль");
    }

    @Test
    void unknownUserLoginWritesLoginFailureRowWithUsername() throws Exception {
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"ghost\",\"password\":\"whatever\"}"))
                .andExpect(status().isUnauthorized());

        List<AuditLog> rows = repository.findAll();
        assertThat(rows).hasSize(1);
        assertThat(rows.get(0).getAction()).isEqualTo(AuditAction.LOGIN_FAILURE);
        assertThat(rows.get(0).getActor()).isEqualTo("ghost");
    }

    @Test
    void loginAuditRowsAreReadableThroughAuditEndpoint() throws Exception {
        // Three distinct login attempts (1 success, 2 failures) should surface on /api/v1/audit.
        loginAs("pm", "pmPass1!");
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"ba\",\"password\":\"wrong\"}"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"ghost\",\"password\":\"zzz\"}"))
                .andExpect(status().isUnauthorized());

        String pmToken = loginAs("pm", "pmPass1!");
        mockMvc.perform(get("/api/v1/audit")
                        .header(HttpHeaders.AUTHORIZATION, bearer(pmToken)))
                .andExpect(status().isOk())
                // 1 initial pm success + 2 failures + 1 reissue pm success = 4
                .andExpect(jsonPath("$.totalElements").value(4));
    }
}
