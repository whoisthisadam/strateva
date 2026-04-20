package com.strateva.auth.web.dto;

import com.strateva.auth.domain.Role;
import com.strateva.auth.domain.User;

import java.util.UUID;

public record UserSummary(
        UUID id,
        String username,
        String fullName,
        Role role
) {
    public static UserSummary from(User user) {
        return new UserSummary(user.getId(), user.getUsername(), user.getFullName(), user.getRole());
    }
}
