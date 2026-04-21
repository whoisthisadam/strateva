package com.strateva.backlog.service;

import com.strateva.audit.AuditAction;
import com.strateva.audit.Auditable;
import com.strateva.backlog.domain.Backlog;
import com.strateva.backlog.domain.BacklogItem;
import com.strateva.backlog.domain.BacklogRepository;
import com.strateva.backlog.domain.BacklogStatus;
import com.strateva.backlog.web.dto.BacklogCreateRequest;
import com.strateva.backlog.web.dto.BacklogItemRequest;
import com.strateva.backlog.web.dto.BacklogResponse;
import com.strateva.backlog.web.dto.BacklogSummary;
import com.strateva.common.error.BusinessRuleViolationException;
import com.strateva.common.error.NotFoundException;
import com.strateva.goal.domain.StrategicGoal;
import com.strateva.goal.domain.StrategicGoalRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class BacklogService {

    private final BacklogRepository repository;
    private final StrategicGoalRepository goalRepository;

    public BacklogService(BacklogRepository repository, StrategicGoalRepository goalRepository) {
        this.repository = repository;
        this.goalRepository = goalRepository;
    }

    @Auditable(action = AuditAction.CREATE, entityType = "Backlog")
    public BacklogResponse create(BacklogCreateRequest request) {
        StrategicGoal goal = goalRepository.findById(request.goalId())
                .orElseThrow(() -> new BusinessRuleViolationException(
                        "Выбранная стратегическая цель не найдена"));
        Backlog backlog = new Backlog(request.title(), goal);
        if (request.items() != null) {
            for (BacklogItemRequest item : request.items()) {
                backlog.addItem(new BacklogItem(item.title(), item.description(), item.priority()));
            }
        }
        return BacklogResponse.from(repository.save(backlog));
    }

    @Auditable(action = AuditAction.UPDATE, entityType = "Backlog")
    public BacklogResponse addItem(UUID backlogId, BacklogItemRequest request) {
        Backlog backlog = loadWithItems(backlogId);
        requireItemsMutable(backlog);
        backlog.addItem(new BacklogItem(request.title(), request.description(), request.priority()));
        return BacklogResponse.from(repository.save(backlog));
    }

    @Auditable(action = AuditAction.UPDATE, entityType = "Backlog")
    public BacklogResponse updateItem(UUID backlogId, UUID itemId, BacklogItemRequest request) {
        Backlog backlog = loadWithItems(backlogId);
        requireItemsMutable(backlog);
        BacklogItem item = backlog.getItems().stream()
                .filter(i -> i.getId().equals(itemId))
                .findFirst()
                .orElseThrow(() -> new NotFoundException("Элемент бэклога не найден"));
        item.setTitle(request.title());
        item.setDescription(request.description());
        item.setPriority(request.priority());
        return BacklogResponse.from(repository.save(backlog));
    }

    @Auditable(action = AuditAction.UPDATE, entityType = "Backlog")
    public BacklogResponse removeItem(UUID backlogId, UUID itemId) {
        Backlog backlog = loadWithItems(backlogId);
        requireItemsMutable(backlog);
        BacklogItem item = backlog.getItems().stream()
                .filter(i -> i.getId().equals(itemId))
                .findFirst()
                .orElseThrow(() -> new NotFoundException("Элемент бэклога не найден"));
        backlog.removeItem(item);
        return BacklogResponse.from(repository.save(backlog));
    }

    @Auditable(action = AuditAction.UPDATE, entityType = "Backlog")
    public BacklogResponse submitForApproval(UUID id) {
        Backlog backlog = loadWithItems(id);
        if (!BacklogTransitions.canSubmit(backlog.getStatus())) {
            throw new BusinessRuleViolationException(
                    "Отправить на согласование можно только бэклог в статусе «Черновик»");
        }
        if (backlog.getItems().isEmpty()) {
            throw new BusinessRuleViolationException(
                    "Добавьте хотя бы один элемент перед отправкой на согласование");
        }
        backlog.setStatus(BacklogStatus.SUBMITTED);
        backlog.setSubmittedAt(Instant.now());
        return BacklogResponse.from(repository.save(backlog));
    }

    @Auditable(action = AuditAction.UPDATE, entityType = "Backlog")
    public BacklogResponse sign(UUID id) {
        Backlog backlog = loadWithItems(id);
        if (!BacklogTransitions.canSign(backlog.getStatus())) {
            throw new BusinessRuleViolationException(
                    "Подписать можно только бэклог в статусе «На согласовании»");
        }
        backlog.setStatus(BacklogStatus.SIGNED);
        backlog.setSignedAt(Instant.now());
        backlog.setSignedBy(currentActor());
        return BacklogResponse.from(repository.save(backlog));
    }

    @Auditable(action = AuditAction.UPDATE, entityType = "Backlog")
    public BacklogResponse cancel(UUID id) {
        Backlog backlog = loadWithItems(id);
        if (!BacklogTransitions.canCancel(backlog.getStatus())) {
            throw new BusinessRuleViolationException(
                    "Сторнировать можно только бэклог, который ещё не подписан");
        }
        backlog.setStatus(BacklogStatus.CANCELLED);
        backlog.setCancelledAt(Instant.now());
        backlog.setCancelledBy(currentActor());
        return BacklogResponse.from(repository.save(backlog));
    }

    @Transactional(readOnly = true)
    public Page<BacklogSummary> findAll(BacklogStatus status, UUID goalId, String search,
                                        String createdBy, Pageable pageable) {
        Specification<Backlog> spec = BacklogSpecifications.status(status)
                .and(BacklogSpecifications.goalId(goalId))
                .and(BacklogSpecifications.titleContains(search))
                .and(BacklogSpecifications.createdBy(createdBy));
        return repository.findAll(spec, pageable).map(BacklogSummary::from);
    }

    @Transactional(readOnly = true)
    public BacklogResponse findById(UUID id) {
        return BacklogResponse.from(loadWithItems(id));
    }

    private Backlog loadWithItems(UUID id) {
        return repository.findWithItemsById(id)
                .orElseThrow(() -> new NotFoundException("Бэклог не найден"));
    }

    private void requireItemsMutable(Backlog backlog) {
        if (!BacklogTransitions.canMutateItems(backlog.getStatus())) {
            throw new BusinessRuleViolationException(
                    "Редактирование элементов возможно только в статусе «Черновик»");
        }
    }

    private String currentActor() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth == null ? null : auth.getName();
    }
}
