package com.strateva.backlog.domain;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;
import java.util.UUID;

public interface BacklogRepository
        extends JpaRepository<Backlog, UUID>, JpaSpecificationExecutor<Backlog> {

    @EntityGraph(attributePaths = {"items", "goal"})
    Optional<Backlog> findWithItemsById(UUID id);
}
