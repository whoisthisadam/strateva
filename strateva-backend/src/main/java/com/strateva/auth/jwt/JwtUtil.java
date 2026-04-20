package com.strateva.auth.jwt;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;

/**
 * JWT helper backed by HS256. Expiration defaults to 8h (see Assumption 8 in the plan).
 */
@Component
public class JwtUtil {

    static final String CLAIM_ROLE = "role";
    static final String CLAIM_UID = "uid";

    private final SecretKey signingKey;
    private final long expirationMs;
    private final String issuer;

    public JwtUtil(@Value("${strateva.security.jwt.secret}") String secret,
                   @Value("${strateva.security.jwt.expiration-ms:28800000}") long expirationMs,
                   @Value("${strateva.security.jwt.issuer:strateva}") String issuer) {
        byte[] secretBytes = secret.getBytes(StandardCharsets.UTF_8);
        if (secretBytes.length < 32) {
            throw new IllegalStateException("strateva.security.jwt.secret must be at least 32 bytes");
        }
        this.signingKey = Keys.hmacShaKeyFor(secretBytes);
        this.expirationMs = expirationMs;
        this.issuer = issuer;
    }

    public String issueToken(String username, String role, String userId) {
        Instant now = Instant.now();
        return Jwts.builder()
                .issuer(issuer)
                .subject(username)
                .claim(CLAIM_ROLE, role)
                .claim(CLAIM_UID, userId)
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plus(Duration.ofMillis(expirationMs))))
                .signWith(signingKey)
                .compact();
    }

    public Jws<Claims> parse(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .requireIssuer(issuer)
                .build()
                .parseSignedClaims(token);
    }

    public long expirationMs() {
        return expirationMs;
    }
}
