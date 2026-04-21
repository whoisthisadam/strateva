package com.strateva.backlog.service;

import com.strateva.backlog.domain.BacklogStatus;

import java.util.Set;

/**
 * Encodes the legal state-machine for backlogs:
 * DRAFT → SUBMITTED (BA submit), SUBMITTED → SIGNED (PM sign),
 * DRAFT|SUBMITTED → CANCELLED (PM cancel). SIGNED and CANCELLED are terminal.
 */
final class BacklogTransitions {

    private static final Set<BacklogStatus> CANCELLABLE =
            Set.of(BacklogStatus.DRAFT, BacklogStatus.SUBMITTED);

    private BacklogTransitions() {}

    static boolean canSubmit(BacklogStatus from) {
        return from == BacklogStatus.DRAFT;
    }

    static boolean canSign(BacklogStatus from) {
        return from == BacklogStatus.SUBMITTED;
    }

    static boolean canCancel(BacklogStatus from) {
        return CANCELLABLE.contains(from);
    }

    static boolean canMutateItems(BacklogStatus from) {
        return from == BacklogStatus.DRAFT;
    }
}
