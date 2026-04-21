package com.strateva.goal.service;

import com.strateva.goal.domain.GoalStatus;

import java.util.Map;
import java.util.Set;

/**
 * Encodes the legal state-machine for strategic goals.
 * {@link GoalStatus#DRAFT} → {@link GoalStatus#SUBMITTED} is performed via
 * {@code submitDocumentation}; the remaining edges are driven via {@code transition}.
 */
final class GoalTransitions {

    static final Map<GoalStatus, Set<GoalStatus>> ALLOWED = Map.of(
            GoalStatus.SUBMITTED, Set.of(GoalStatus.ACTIVE),
            GoalStatus.ACTIVE, Set.of(GoalStatus.COMPLETED, GoalStatus.ARCHIVED),
            GoalStatus.COMPLETED, Set.of(GoalStatus.ARCHIVED)
    );

    private GoalTransitions() {}

    static boolean isAllowed(GoalStatus from, GoalStatus to) {
        return ALLOWED.getOrDefault(from, Set.of()).contains(to);
    }
}
