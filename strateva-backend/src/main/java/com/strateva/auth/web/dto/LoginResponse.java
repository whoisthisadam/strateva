package com.strateva.auth.web.dto;

public record LoginResponse(
        String token,
        long expiresInMs,
        UserSummary user
) {}
