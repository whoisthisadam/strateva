package com.strateva.report.web.dto;

/**
 * One row of the «Пропускная способность бэклогов» report: aggregates the
 * count of SIGNED backlogs per ISO year-month window ({@code YYYY-MM}).
 * {@code itemCount} totals all backlog items inside those signed backlogs.
 */
public record BacklogThroughputRow(
        String period,
        long signedCount,
        long itemCount) {}
