package com.strateva.common.error;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.Instant;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiError(
        Instant timestamp,
        int status,
        String error,
        String code,
        String message,
        String path,
        List<FieldViolation> fieldErrors
) {
    public static ApiError of(int status, String error, String code, String message, String path) {
        return new ApiError(Instant.now(), status, error, code, message, path, null);
    }

    public static ApiError validation(int status, String path, List<FieldViolation> violations) {
        return new ApiError(Instant.now(), status, "Bad Request", "VALIDATION_FAILED",
                "Ошибка валидации данных", path, violations);
    }

    public record FieldViolation(String field, String message) {}
}
