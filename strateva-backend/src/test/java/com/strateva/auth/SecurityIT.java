package com.strateva.auth;

import com.strateva.auth.jwt.JwtUtil;
import com.strateva.support.AbstractPostgresIT;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Verifies the JWT filter chain: protected endpoints return 401 without a token,
 * 401 for tampered signatures, 401 for expired tokens, and 200 with a valid token.
 */
class SecurityIT extends AbstractPostgresIT {

    @Autowired
    private JwtUtil jwtUtil;

    @Test
    void protectedEndpointWithoutTokenReturns401() throws Exception {
        mockMvc.perform(get("/api/v1/auth/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
    }

    @Test
    void protectedEndpointWithTamperedTokenReturns401() throws Exception {
        String token = loginAs("pm", "pmPass1!");
        String tampered = token.substring(0, token.length() - 2) + "aa";
        mockMvc.perform(get("/api/v1/auth/me")
                        .header(HttpHeaders.AUTHORIZATION, bearer(tampered)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void protectedEndpointWithExpiredTokenReturns401() throws Exception {
        // Issue a token that is already expired using the same secret.
        JwtUtil expiredIssuer = new JwtUtil(
                "test-secret-key-that-is-at-least-32-bytes-long-xxxxxxx",
                -1_000L,
                "strateva");
        String expired = expiredIssuer.issueToken("pm", "ROLE_PROJECT_MANAGER", "id");
        mockMvc.perform(get("/api/v1/auth/me")
                        .header(HttpHeaders.AUTHORIZATION, bearer(expired)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void protectedEndpointWithValidTokenReturns200() throws Exception {
        String token = loginAs("pm", "pmPass1!");
        mockMvc.perform(get("/api/v1/auth/me")
                        .header(HttpHeaders.AUTHORIZATION, bearer(token)))
                .andExpect(status().isOk());
        // Silence unused-field warning if analyzers complain.
        assert jwtUtil.expirationMs() > 0;
    }

    @Test
    void protectedEndpointWithGarbageTokenReturns401() throws Exception {
        mockMvc.perform(get("/api/v1/auth/me")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer not-a-jwt"))
                .andExpect(status().isUnauthorized());
    }
}
