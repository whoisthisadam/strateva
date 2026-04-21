package com.strateva.goal.service;

import com.strateva.audit.AuditAction;
import com.strateva.audit.Auditable;
import com.strateva.common.error.BusinessRuleViolationException;
import com.strateva.common.error.NotFoundException;
import com.strateva.goal.domain.GoalStatus;
import com.strateva.goal.domain.Kpi;
import com.strateva.goal.domain.Priority;
import com.strateva.goal.domain.StrategicGoal;
import com.strateva.goal.domain.StrategicGoalRepository;
import com.strateva.goal.web.dto.GoalCreateRequest;
import com.strateva.goal.web.dto.GoalResponse;
import com.strateva.goal.web.dto.GoalSummary;
import com.strateva.goal.web.dto.GoalUpdateRequest;
import com.strateva.goal.web.dto.KpiRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class GoalService {

    private final StrategicGoalRepository repository;

    public GoalService(StrategicGoalRepository repository) {
        this.repository = repository;
    }

    @Auditable(action = AuditAction.CREATE, entityType = "StrategicGoal")
    public GoalResponse create(GoalCreateRequest request) {
        requireKpis(request.kpis());
        requireValidPeriod(request.periodStart(), request.periodEnd());
        StrategicGoal goal = new StrategicGoal(
                request.title(),
                request.description(),
                request.periodStart(),
                request.periodEnd(),
                request.priority());
        replaceKpis(goal, request.kpis());
        return GoalResponse.from(repository.save(goal));
    }

    @Auditable(action = AuditAction.UPDATE, entityType = "StrategicGoal")
    public GoalResponse update(UUID id, GoalUpdateRequest request) {
        StrategicGoal goal = loadWithKpis(id);
        if (goal.getStatus() != GoalStatus.DRAFT && goal.getStatus() != GoalStatus.SUBMITTED) {
            throw new BusinessRuleViolationException(
                    "Редактирование возможно только в статусах «Черновик» и «На согласовании»");
        }
        requireKpis(request.kpis());
        requireValidPeriod(request.periodStart(), request.periodEnd());
        goal.setTitle(request.title());
        goal.setDescription(request.description());
        goal.setPeriodStart(request.periodStart());
        goal.setPeriodEnd(request.periodEnd());
        goal.setPriority(request.priority());
        replaceKpis(goal, request.kpis());
        return GoalResponse.from(repository.save(goal));
    }

    @Auditable(action = AuditAction.UPDATE, entityType = "StrategicGoal")
    public GoalResponse submitDocumentation(UUID id) {
        StrategicGoal goal = loadWithKpis(id);
        if (goal.getStatus() != GoalStatus.DRAFT) {
            throw new BusinessRuleViolationException(
                    "Отправить на согласование можно только цель в статусе «Черновик»");
        }
        goal.setStatus(GoalStatus.SUBMITTED);
        return GoalResponse.from(repository.save(goal));
    }

    @Auditable(action = AuditAction.UPDATE, entityType = "StrategicGoal")
    public GoalResponse transition(UUID id, GoalStatus target) {
        StrategicGoal goal = loadWithKpis(id);
        if (!GoalTransitions.isAllowed(goal.getStatus(), target)) {
            throw new BusinessRuleViolationException(
                    "Недопустимый переход статуса цели");
        }
        goal.setStatus(target);
        return GoalResponse.from(repository.save(goal));
    }

    @Auditable(action = AuditAction.DELETE, entityType = "StrategicGoal")
    public GoalResponse delete(UUID id) {
        StrategicGoal goal = loadWithKpis(id);
        if (goal.getStatus() != GoalStatus.DRAFT) {
            throw new BusinessRuleViolationException(
                    "Удалить можно только цель в статусе «Черновик»");
        }
        GoalResponse snapshot = GoalResponse.from(goal);
        repository.delete(goal);
        return snapshot;
    }

    @Transactional(readOnly = true)
    public Page<GoalSummary> findAll(GoalStatus status, Priority priority, String search, Pageable pageable) {
        Specification<StrategicGoal> spec = GoalSpecifications.status(status)
                .and(GoalSpecifications.priority(priority))
                .and(GoalSpecifications.titleContains(search));
        return repository.findAll(spec, pageable).map(GoalSummary::from);
    }

    @Transactional(readOnly = true)
    public Page<GoalSummary> findForEmployee(Pageable pageable) {
        // UC-10 full spec (filter by Task.assignedTo = current user) requires the Task
        // aggregate, which ships in Phase 6. Until then, employees see every ACTIVE goal
        // system-wide. When tasks land, narrow via a join on Task.assignedTo.
        Specification<StrategicGoal> spec = GoalSpecifications.status(GoalStatus.ACTIVE);
        return repository.findAll(spec, pageable).map(GoalSummary::from);
    }

    @Transactional(readOnly = true)
    public GoalResponse findById(UUID id) {
        return GoalResponse.from(loadWithKpis(id));
    }

    private StrategicGoal loadWithKpis(UUID id) {
        return repository.findWithKpisById(id)
                .orElseThrow(() -> new NotFoundException("Цель не найдена"));
    }

    private void requireKpis(List<KpiRequest> kpis) {
        if (kpis == null || kpis.isEmpty()) {
            throw new BusinessRuleViolationException(
                    "Добавьте хотя бы один ключевой показатель эффективности");
        }
    }

    private void requireValidPeriod(java.time.LocalDate start, java.time.LocalDate end) {
        if (start.isAfter(end)) {
            throw new BusinessRuleViolationException(
                    "Дата окончания периода должна быть позже даты начала");
        }
    }

    private void replaceKpis(StrategicGoal goal, List<KpiRequest> kpiRequests) {
        goal.clearKpis();
        for (KpiRequest r : kpiRequests) {
            BigDecimal current = r.currentValue() == null ? BigDecimal.ZERO : r.currentValue();
            goal.addKpi(new Kpi(r.name(), r.targetValue(), current, r.unit()));
        }
    }
}
