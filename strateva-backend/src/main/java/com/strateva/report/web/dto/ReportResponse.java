package com.strateva.report.web.dto;

import java.time.Instant;
import java.util.List;

/**
 * Generic envelope for every report returned by {@code ReportController}.
 * Captures BR-6 metadata (source, actor, timestamp) so clients can render
 * «Сформирован пользователем {@code generatedBy} в {@code generatedAt}».
 */
public record ReportResponse<T>(
        Instant generatedAt,
        String generatedBy,
        int count,
        List<T> rows) {

    public static <T> ReportResponse<T> of(String generatedBy, List<T> rows) {
        return new ReportResponse<>(Instant.now(), generatedBy, rows.size(), rows);
    }
}
