package com.strateva.common.error;

/**
 * Raised when an operation is syntactically valid but violates a business rule
 * (e.g. BR-4: goal must have at least one KPI, illegal status transitions).
 * Maps to HTTP 400 with code {@code BUSINESS_RULE_VIOLATED}.
 */
public class BusinessRuleViolationException extends RuntimeException {
    public BusinessRuleViolationException(String message) {
        super(message);
    }
}
