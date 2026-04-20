package com.strateva.auth.jwt;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.security.SignatureException;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Field;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JwtUtilTest {

    private static final String SECRET = "unit-test-secret-key-that-is-at-least-32-bytes-long-xxxx";

    @Test
    void issuedTokenParsesBackWithSameClaims() {
        JwtUtil util = new JwtUtil(SECRET, 28_800_000L, "strateva");

        String token = util.issueToken("pm", "ROLE_PROJECT_MANAGER", "user-id-1");
        Jws<Claims> parsed = util.parse(token);
        Claims claims = parsed.getPayload();

        assertThat(claims.getSubject()).isEqualTo("pm");
        assertThat(claims.getIssuer()).isEqualTo("strateva");
        assertThat(claims.get(JwtUtil.CLAIM_ROLE, String.class)).isEqualTo("ROLE_PROJECT_MANAGER");
        assertThat(claims.get(JwtUtil.CLAIM_UID, String.class)).isEqualTo("user-id-1");
    }

    @Test
    void defaultExpirationIsEightHoursInMilliseconds() {
        JwtUtil util = new JwtUtil(SECRET, 28_800_000L, "strateva");
        assertThat(util.expirationMs()).isEqualTo(28_800_000L);
    }

    @Test
    void expiredTokenIsRejected() throws Exception {
        JwtUtil util = new JwtUtil(SECRET, -1_000L, "strateva");
        String token = util.issueToken("pm", "ROLE_PROJECT_MANAGER", "id");

        assertThatThrownBy(() -> util.parse(token))
                .isInstanceOf(ExpiredJwtException.class);
        // silence unused warning on reflection import
        Field.class.getName();
    }

    @Test
    void tamperedTokenIsRejected() {
        JwtUtil util = new JwtUtil(SECRET, 28_800_000L, "strateva");
        String token = util.issueToken("pm", "ROLE_PROJECT_MANAGER", "id");
        String tampered = token.substring(0, token.length() - 2) + "aa";

        assertThatThrownBy(() -> util.parse(tampered))
                .isInstanceOf(SignatureException.class);
    }

    @Test
    void shortSecretIsRejectedAtConstruction() {
        assertThatThrownBy(() -> new JwtUtil("too-short", 1000L, "strateva"))
                .isInstanceOf(IllegalStateException.class);
    }
}
