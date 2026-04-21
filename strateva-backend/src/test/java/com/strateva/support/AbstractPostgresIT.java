package com.strateva.support;

import com.strateva.auth.web.dto.LoginResponse;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.ObjectMapper;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Base class for integration tests backed by the local PostgreSQL instance
 * (database {@code strateva_test}). Testcontainers is preferred but unavailable
 * in this environment, so we fall back to the local engine via the {@code test}
 * profile. Each test starts with an empty {@code audit_log} so assertions can
 * count rows deterministically.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@ActiveProfiles("test")
public abstract class AbstractPostgresIT {

    @Autowired
    protected MockMvc mockMvc;

    @Autowired
    protected ObjectMapper objectMapper;

    @Autowired
    protected JdbcTemplate jdbc;

    @BeforeEach
    void truncateAuditLog() {
        jdbc.execute("TRUNCATE TABLE audit_log");
    }

    /**
     * Drives the real {@code /api/v1/auth/login} flow and returns the issued JWT.
     * Uses the seeded credentials from {@code UserSeeder}
     * (pm/pmPass1!, ba/baPass1!, emp/empPass1!).
     */
    protected String loginAs(String username, String password) throws Exception {
        String body = """
                {"username":"%s","password":"%s"}
                """.formatted(username, password);
        String json = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();
        return objectMapper.readValue(json, LoginResponse.class).token();
    }

    protected String bearer(String token) {
        return "Bearer " + token;
    }
}
