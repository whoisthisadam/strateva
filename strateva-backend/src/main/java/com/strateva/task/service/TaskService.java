package com.strateva.task.service;

import com.strateva.audit.AuditAction;
import com.strateva.audit.Auditable;
import com.strateva.auth.domain.Role;
import com.strateva.auth.domain.User;
import com.strateva.auth.domain.UserRepository;
import com.strateva.backlog.domain.BacklogItem;
import com.strateva.backlog.domain.BacklogItemRepository;
import com.strateva.common.error.BusinessRuleViolationException;
import com.strateva.common.error.NotFoundException;
import com.strateva.goal.domain.GoalStatus;
import com.strateva.goal.domain.Priority;
import com.strateva.goal.domain.StrategicGoal;
import com.strateva.goal.domain.StrategicGoalRepository;
import com.strateva.task.domain.Task;
import com.strateva.task.domain.TaskRepository;
import com.strateva.task.domain.TaskStatus;
import com.strateva.task.web.dto.TaskCreateRequest;
import com.strateva.task.web.dto.TaskResponse;
import com.strateva.task.web.dto.TaskSummary;
import com.strateva.task.web.dto.TaskUpdateRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@Transactional
public class TaskService {

    private final TaskRepository repository;
    private final StrategicGoalRepository goalRepository;
    private final BacklogItemRepository backlogItemRepository;
    private final UserRepository userRepository;

    public TaskService(TaskRepository repository,
                       StrategicGoalRepository goalRepository,
                       BacklogItemRepository backlogItemRepository,
                       UserRepository userRepository) {
        this.repository = repository;
        this.goalRepository = goalRepository;
        this.backlogItemRepository = backlogItemRepository;
        this.userRepository = userRepository;
    }

    @Auditable(action = AuditAction.CREATE, entityType = "Task")
    public TaskResponse create(TaskCreateRequest request) {
        StrategicGoal goal = goalRepository.findById(request.goalId())
                .orElseThrow(() -> new BusinessRuleViolationException(
                        "Выбранная стратегическая цель не найдена"));
        if (goal.getStatus() == GoalStatus.ARCHIVED) {
            throw new BusinessRuleViolationException(
                    "Нельзя создавать задачи для архивной цели");
        }
        BacklogItem backlogItem = null;
        if (request.backlogItemId() != null) {
            backlogItem = backlogItemRepository.findById(request.backlogItemId())
                    .orElseThrow(() -> new BusinessRuleViolationException(
                            "Выбранный элемент бэклога не найден"));
        }
        Task task = new Task(request.title(), request.description(),
                goal, backlogItem, request.priority(), request.deadline());
        return TaskResponse.from(repository.save(task));
    }

    @Auditable(action = AuditAction.UPDATE, entityType = "Task")
    public TaskResponse update(UUID id, TaskUpdateRequest request) {
        Task task = load(id);
        if (task.getStatus() == TaskStatus.DONE) {
            throw new BusinessRuleViolationException(
                    "Редактирование невозможно для завершённой задачи");
        }
        task.setTitle(request.title());
        task.setDescription(request.description());
        task.setPriority(request.priority());
        task.setDeadline(request.deadline());
        return TaskResponse.from(repository.save(task));
    }

    @Auditable(action = AuditAction.UPDATE, entityType = "Task")
    public TaskResponse assign(UUID id, String assignee) {
        Task task = load(id);
        User user = userRepository.findByUsername(assignee)
                .orElseThrow(() -> new BusinessRuleViolationException(
                        "Пользователь не найден"));
        if (user.getRole() != Role.EMPLOYEE) {
            throw new BusinessRuleViolationException(
                    "Назначить можно только пользователя с ролью «Сотрудник»");
        }
        if (!user.isActive()) {
            throw new BusinessRuleViolationException(
                    "Нельзя назначить задачу неактивному пользователю");
        }
        task.setAssignedTo(user.getUsername());
        return TaskResponse.from(repository.save(task));
    }

    @Auditable(action = AuditAction.UPDATE, entityType = "Task")
    public TaskResponse changeStatus(UUID id, TaskStatus target, String actor, Role actorRole) {
        Task task = load(id);
        if (actorRole == Role.EMPLOYEE
                && (task.getAssignedTo() == null || !task.getAssignedTo().equals(actor))) {
            throw new BusinessRuleViolationException(
                    "Изменять статус можно только у собственных задач");
        }
        if (!TaskTransitions.isAllowed(task.getStatus(), target)) {
            throw new BusinessRuleViolationException(
                    "Недопустимый переход статуса задачи");
        }
        // BR-3: status may leave TODO only when assigned.
        if (task.getStatus() == TaskStatus.TODO && task.getAssignedTo() == null) {
            throw new BusinessRuleViolationException(
                    "Нельзя менять статус неназначенной задачи");
        }
        task.setStatus(target);
        return TaskResponse.from(repository.save(task));
    }

    @Auditable(action = AuditAction.DELETE, entityType = "Task")
    public TaskResponse delete(UUID id) {
        Task task = load(id);
        if (task.getStatus() != TaskStatus.TODO) {
            throw new BusinessRuleViolationException(
                    "Удалить можно только задачу в статусе «К выполнению»");
        }
        TaskResponse snapshot = TaskResponse.from(task);
        repository.delete(task);
        return snapshot;
    }

    @Transactional(readOnly = true)
    public Page<TaskSummary> findAll(TaskStatus status, Priority priority, UUID goalId,
                                     String assignee, String search, Pageable pageable) {
        Specification<Task> spec = TaskSpecifications.status(status)
                .and(TaskSpecifications.priority(priority))
                .and(TaskSpecifications.goalId(goalId))
                .and(TaskSpecifications.assignedTo(assignee))
                .and(TaskSpecifications.titleContains(search));
        return repository.findAll(spec, pageable).map(TaskSummary::from);
    }

    @Transactional(readOnly = true)
    public TaskResponse findById(UUID id) {
        return TaskResponse.from(load(id));
    }

    private Task load(UUID id) {
        return repository.findWithRelationsById(id)
                .orElseThrow(() -> new NotFoundException("Задача не найдена"));
    }
}
