package com.strateva.report.web;

import java.util.List;
import java.util.function.Function;

/**
 * Minimal RFC-4180 CSV writer. Prepends a UTF-8 BOM so Cyrillic headers open
 * correctly in Microsoft Excel without an explicit import wizard.
 */
final class CsvWriter {

    static final String BOM = "\uFEFF";

    private CsvWriter() {}

    static <T> String write(List<String> headers, List<T> rows, Function<T, List<?>> mapper) {
        StringBuilder sb = new StringBuilder(BOM);
        appendRow(sb, headers);
        for (T row : rows) {
            List<?> cells = mapper.apply(row);
            List<String> rendered = cells.stream().map(CsvWriter::format).toList();
            appendRow(sb, rendered);
        }
        return sb.toString();
    }

    private static void appendRow(StringBuilder sb, List<String> cells) {
        for (int i = 0; i < cells.size(); i++) {
            if (i > 0) sb.append(',');
            sb.append(escape(cells.get(i)));
        }
        sb.append("\r\n");
    }

    private static String format(Object value) {
        if (value == null) return "";
        return String.valueOf(value);
    }

    private static String escape(String raw) {
        if (raw == null) return "";
        boolean needsQuoting = raw.indexOf(',') >= 0 || raw.indexOf('"') >= 0
                || raw.indexOf('\n') >= 0 || raw.indexOf('\r') >= 0;
        if (!needsQuoting) return raw;
        return '"' + raw.replace("\"", "\"\"") + '"';
    }
}
