package com.strateva.goal.domain;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;
import java.util.UUID;

public interface StrategicGoalRepository
        extends JpaRepository<StrategicGoal, UUID>, JpaSpecificationExecutor<StrategicGoal> {

    @EntityGraph(attributePaths = "kpis")
    Optional<StrategicGoal> findWithKpisById(UUID id);
}
