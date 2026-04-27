package com.strateva.goal.service;

import com.strateva.goal.domain.GoalStatus;

import java.util.Map;
import java.util.Set;

/**
 * Encodes the legal state-machine for strategic goals. All transitions are driven
 * via the explicit {@code activate}, {@code complete} and {@code archive} methods
 * on {@code GoalService}; this map is the single source of truth those methods
 * consult before mutating state.
 */
final class GoalTransitions {

    static final Map<GoalStatus, Set<GoalStatus>> ALLOWED = Map.of(
            GoalStatus.DRAFT, Set.of(GoalStatus.ACTIVE, GoalStatus.ARCHIVED),
            GoalStatus.ACTIVE, Set.of(GoalStatus.COMPLETED, GoalStatus.ARCHIVED),
            GoalStatus.COMPLETED, Set.of(GoalStatus.ARCHIVED)
    );

    private GoalTransitions() {}

    static boolean isAllowed(GoalStatus from, GoalStatus to) {
        return ALLOWED.getOrDefault(from, Set.of()).contains(to);
    }
}
