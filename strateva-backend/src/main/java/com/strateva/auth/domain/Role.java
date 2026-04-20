package com.strateva.auth.domain;

/**
 * Three fixed roles per Use-Case matrix. Roles are stored in DB as strings.
 * Spring Security authorities are exposed with the "ROLE_" prefix.
 */
public enum Role {
    PROJECT_MANAGER,
    BUSINESS_ANALYST,
    EMPLOYEE;

    public String authority() {
        return "ROLE_" + name();
    }
}
