package com.strateva.task.domain;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;
import java.util.UUID;

public interface TaskRepository
        extends JpaRepository<Task, UUID>, JpaSpecificationExecutor<Task> {

    @EntityGraph(attributePaths = {"goal", "backlogItem"})
    Optional<Task> findWithRelationsById(UUID id);
}
