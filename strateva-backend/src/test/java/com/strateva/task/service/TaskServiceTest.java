package com.strateva.task.service;

import com.strateva.auth.domain.Role;
import com.strateva.auth.domain.User;
import com.strateva.auth.domain.UserRepository;
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
import com.strateva.task.web.dto.TaskUpdateRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Field;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link TaskService}: covers BR-3 (task must be assigned before
 * leaving TODO), BR-5 (no tasks for ARCHIVED goals), the state machine,
 * assignee-role guard, UC-9 own-task enforcement for EMPLOYEE, and DONE immutability.
 */
class TaskServiceTest {

    private TaskRepository repository;
    private StrategicGoalRepository goalRepository;
    private BacklogItemRepository backlogItemRepository;
    private UserRepository userRepository;
    private TaskService service;

    @BeforeEach
    void setUp() {
        repository = mock(TaskRepository.class);
        goalRepository = mock(StrategicGoalRepository.class);
        backlogItemRepository = mock(BacklogItemRepository.class);
        userRepository = mock(UserRepository.class);
        service = new TaskService(repository, goalRepository, backlogItemRepository, userRepository);
        when(repository.save(any(Task.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    private StrategicGoal goal(GoalStatus status) throws Exception {
        StrategicGoal g = new StrategicGoal("Goal", "d",
                LocalDate.of(2026, 1, 1), LocalDate.of(2026, 12, 31), Priority.HIGH);
        g.setStatus(status);
        setField(g, "id", UUID.randomUUID());
        return g;
    }

    private Task persisted(TaskStatus status, String assignee) throws Exception {
        Task t = new Task("Task", "d", goal(GoalStatus.ACTIVE), null, Priority.MEDIUM, null);
        t.setStatus(status);
        t.setAssignedTo(assignee);
        setField(t, "id", UUID.randomUUID());
        return t;
    }

    private User employee(String username, boolean active) throws Exception {
        User u = new User(username, "hash", username + " Name", Role.EMPLOYEE);
        u.setActive(active);
        setField(u, "id", UUID.randomUUID());
        return u;
    }

    private void setField(Object target, String name, Object value) throws Exception {
        Class<?> c = target.getClass();
        while (c != null) {
            try {
                Field f = c.getDeclaredField(name);
                f.setAccessible(true);
                f.set(target, value);
                return;
            } catch (NoSuchFieldException ignored) {
                c = c.getSuperclass();
            }
        }
        throw new NoSuchFieldException(name);
    }

    @Test
    void create_forArchivedGoal_isRejected_BR5() throws Exception {
        StrategicGoal archived = goal(GoalStatus.ARCHIVED);
        when(goalRepository.findById(archived.getId())).thenReturn(Optional.of(archived));
        assertThatThrownBy(() -> service.create(new TaskCreateRequest(
                "t", "d", archived.getId(), null, Priority.LOW, null)))
                .isInstanceOf(BusinessRuleViolationException.class)
                .hasMessageContaining("архивной");
    }

    @Test
    void create_unknownGoal_isRejected() {
        UUID id = UUID.randomUUID();
        when(goalRepository.findById(id)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.create(new TaskCreateRequest(
                "t", null, id, null, Priority.LOW, null)))
                .isInstanceOf(BusinessRuleViolationException.class);
    }

    @Test
    void create_onActiveGoal_startsInTodo() throws Exception {
        StrategicGoal g = goal(GoalStatus.ACTIVE);
        when(goalRepository.findById(g.getId())).thenReturn(Optional.of(g));
        var response = service.create(new TaskCreateRequest(
                "Задача", "d", g.getId(), null, Priority.HIGH, LocalDate.now()));
        assertThat(response.status()).isEqualTo(TaskStatus.TODO);
        assertThat(response.assignedTo()).isNull();
    }

    @Test
    void changeStatus_leavingTodoWithoutAssignee_isRejected_BR3() throws Exception {
        Task t = persisted(TaskStatus.TODO, null);
        when(repository.findWithRelationsById(t.getId())).thenReturn(Optional.of(t));
        assertThatThrownBy(() -> service.changeStatus(
                t.getId(), TaskStatus.IN_PROGRESS, "pm", Role.PROJECT_MANAGER))
                .isInstanceOf(BusinessRuleViolationException.class)
                .hasMessageContaining("неназ");
    }

    @Test
    void changeStatus_todoToInProgress_withAssignee_succeeds() throws Exception {
        Task t = persisted(TaskStatus.TODO, "emp");
        when(repository.findWithRelationsById(t.getId())).thenReturn(Optional.of(t));
        var response = service.changeStatus(t.getId(), TaskStatus.IN_PROGRESS, "pm", Role.PROJECT_MANAGER);
        assertThat(response.status()).isEqualTo(TaskStatus.IN_PROGRESS);
    }

    @Test
    void changeStatus_illegalTodoToDone_isRejected() throws Exception {
        Task t = persisted(TaskStatus.TODO, "emp");
        when(repository.findWithRelationsById(t.getId())).thenReturn(Optional.of(t));
        assertThatThrownBy(() -> service.changeStatus(
                t.getId(), TaskStatus.DONE, "pm", Role.PROJECT_MANAGER))
                .isInstanceOf(BusinessRuleViolationException.class)
                .hasMessageContaining("Недопустимый");
    }

    @Test
    void changeStatus_doneIsTerminal() throws Exception {
        Task t = persisted(TaskStatus.DONE, "emp");
        when(repository.findWithRelationsById(t.getId())).thenReturn(Optional.of(t));
        assertThatThrownBy(() -> service.changeStatus(
                t.getId(), TaskStatus.IN_PROGRESS, "pm", Role.PROJECT_MANAGER))
                .isInstanceOf(BusinessRuleViolationException.class);
    }

    @Test
    void changeStatus_byEmployeeOnNotOwnTask_isRejected_UC9() throws Exception {
        Task t = persisted(TaskStatus.IN_PROGRESS, "emp");
        when(repository.findWithRelationsById(t.getId())).thenReturn(Optional.of(t));
        assertThatThrownBy(() -> service.changeStatus(
                t.getId(), TaskStatus.DONE, "other", Role.EMPLOYEE))
                .isInstanceOf(BusinessRuleViolationException.class)
                .hasMessageContaining("собственных");
    }

    @Test
    void changeStatus_byEmployeeOnOwnTask_succeeds() throws Exception {
        Task t = persisted(TaskStatus.IN_PROGRESS, "emp");
        when(repository.findWithRelationsById(t.getId())).thenReturn(Optional.of(t));
        var response = service.changeStatus(t.getId(), TaskStatus.DONE, "emp", Role.EMPLOYEE);
        assertThat(response.status()).isEqualTo(TaskStatus.DONE);
    }

    @Test
    void assign_nonEmployeeUser_isRejected() throws Exception {
        Task t = persisted(TaskStatus.TODO, null);
        when(repository.findWithRelationsById(t.getId())).thenReturn(Optional.of(t));
        User ba = new User("ba", "h", "BA", Role.BUSINESS_ANALYST);
        ba.setActive(true);
        when(userRepository.findByUsername("ba")).thenReturn(Optional.of(ba));
        assertThatThrownBy(() -> service.assign(t.getId(), "ba"))
                .isInstanceOf(BusinessRuleViolationException.class)
                .hasMessageContaining("Сотрудник");
    }

    @Test
    void assign_inactiveUser_isRejected() throws Exception {
        Task t = persisted(TaskStatus.TODO, null);
        when(repository.findWithRelationsById(t.getId())).thenReturn(Optional.of(t));
        when(userRepository.findByUsername("emp")).thenReturn(Optional.of(employee("emp", false)));
        assertThatThrownBy(() -> service.assign(t.getId(), "emp"))
                .isInstanceOf(BusinessRuleViolationException.class)
                .hasMessageContaining("неактивному");
    }

    @Test
    void assign_activeEmployee_setsAssignedTo() throws Exception {
        Task t = persisted(TaskStatus.TODO, null);
        when(repository.findWithRelationsById(t.getId())).thenReturn(Optional.of(t));
        when(userRepository.findByUsername("emp")).thenReturn(Optional.of(employee("emp", true)));
        var response = service.assign(t.getId(), "emp");
        assertThat(response.assignedTo()).isEqualTo("emp");
    }

    @Test
    void update_onDoneTask_isRejected() throws Exception {
        Task t = persisted(TaskStatus.DONE, "emp");
        when(repository.findWithRelationsById(t.getId())).thenReturn(Optional.of(t));
        assertThatThrownBy(() -> service.update(t.getId(), new TaskUpdateRequest(
                "new", "d", Priority.LOW, null)))
                .isInstanceOf(BusinessRuleViolationException.class)
                .hasMessageContaining("завершённой");
    }

    @Test
    void delete_nonTodoTask_isRejected() throws Exception {
        Task t = persisted(TaskStatus.IN_PROGRESS, "emp");
        when(repository.findWithRelationsById(t.getId())).thenReturn(Optional.of(t));
        assertThatThrownBy(() -> service.delete(t.getId()))
                .isInstanceOf(BusinessRuleViolationException.class);
    }

    @Test
    void findById_missing_throwsNotFound() {
        UUID id = UUID.randomUUID();
        when(repository.findWithRelationsById(id)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.findById(id)).isInstanceOf(NotFoundException.class);
    }
}
