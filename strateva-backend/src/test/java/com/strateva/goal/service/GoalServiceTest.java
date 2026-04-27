package com.strateva.goal.service;

import com.strateva.common.error.BusinessRuleViolationException;
import com.strateva.common.error.InvalidStatusTransitionException;
import com.strateva.common.error.NotFoundException;
import com.strateva.goal.domain.GoalStatus;
import com.strateva.goal.domain.Priority;
import com.strateva.goal.domain.StrategicGoal;
import com.strateva.goal.domain.StrategicGoalRepository;
import com.strateva.goal.web.dto.GoalCreateRequest;
import com.strateva.goal.web.dto.GoalUpdateRequest;
import com.strateva.goal.web.dto.KpiRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Field;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link GoalService}: covers BR-4 (KPI requirement),
 * illegal status transitions, edit/delete status guards, and successful paths.
 */
class GoalServiceTest {

    private StrategicGoalRepository repository;
    private GoalService service;

    @BeforeEach
    void setUp() {
        repository = mock(StrategicGoalRepository.class);
        service = new GoalService(repository);
        when(repository.save(any(StrategicGoal.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    private KpiRequest kpi(String name) {
        return new KpiRequest(name, new BigDecimal("100"), BigDecimal.ZERO, "шт.");
    }

    private GoalCreateRequest validCreate(List<KpiRequest> kpis) {
        return new GoalCreateRequest(
                "Увеличить выручку",
                "Описание",
                LocalDate.of(2026, 1, 1),
                LocalDate.of(2026, 12, 31),
                Priority.HIGH,
                kpis);
    }

    @Test
    void create_rejectsEmptyKpis_BR4() {
        assertThatThrownBy(() -> service.create(validCreate(List.of())))
                .isInstanceOf(BusinessRuleViolationException.class)
                .hasMessageContaining("ключевой показатель");
    }

    @Test
    void create_rejectsNullKpis_BR4() {
        assertThatThrownBy(() -> service.create(validCreate(null)))
                .isInstanceOf(BusinessRuleViolationException.class);
    }

    @Test
    void create_rejectsReversedPeriod() {
        GoalCreateRequest bad = new GoalCreateRequest(
                "X", null,
                LocalDate.of(2026, 12, 31),
                LocalDate.of(2026, 1, 1),
                Priority.LOW, List.of(kpi("k")));
        assertThatThrownBy(() -> service.create(bad))
                .isInstanceOf(BusinessRuleViolationException.class)
                .hasMessageContaining("позже даты начала");
    }

    @Test
    void create_withOneKpi_succeedsWithDraftStatus() {
        var response = service.create(validCreate(List.of(kpi("Выручка"))));
        assertThat(response.status()).isEqualTo(GoalStatus.DRAFT);
        assertThat(response.kpis()).hasSize(1);
    }

    @Test
    void update_onActiveGoal_isForbidden() throws Exception {
        StrategicGoal goal = persisted(GoalStatus.ACTIVE);
        UUID id = goal.getId();
        when(repository.findWithKpisById(id)).thenReturn(Optional.of(goal));

        GoalUpdateRequest req = new GoalUpdateRequest(
                "new", null, LocalDate.now(), LocalDate.now().plusDays(1),
                Priority.LOW, List.of(kpi("k")));

        assertThatThrownBy(() -> service.update(id, req))
                .isInstanceOf(BusinessRuleViolationException.class)
                .hasMessageContaining("Черновик");
    }

    @Test
    void activate_fromDraft_moves_toActive() throws Exception {
        StrategicGoal goal = persisted(GoalStatus.DRAFT);
        UUID id = goal.getId();
        when(repository.findWithKpisById(id)).thenReturn(Optional.of(goal));

        assertThat(service.activate(id).status()).isEqualTo(GoalStatus.ACTIVE);
    }

    @Test
    void activate_fromCompleted_isRejected() throws Exception {
        StrategicGoal goal = persisted(GoalStatus.COMPLETED);
        UUID id = goal.getId();
        when(repository.findWithKpisById(id)).thenReturn(Optional.of(goal));
        assertThatThrownBy(() -> service.activate(id))
                .isInstanceOf(InvalidStatusTransitionException.class)
                .hasMessageContaining("Недопустимый переход");
    }

    @Test
    void complete_fromActive_moves_toCompleted() throws Exception {
        StrategicGoal goal = persisted(GoalStatus.ACTIVE);
        UUID id = goal.getId();
        when(repository.findWithKpisById(id)).thenReturn(Optional.of(goal));

        assertThat(service.complete(id).status()).isEqualTo(GoalStatus.COMPLETED);
    }

    @Test
    void complete_fromDraft_isRejected() throws Exception {
        StrategicGoal goal = persisted(GoalStatus.DRAFT);
        UUID id = goal.getId();
        when(repository.findWithKpisById(id)).thenReturn(Optional.of(goal));
        assertThatThrownBy(() -> service.complete(id))
                .isInstanceOf(InvalidStatusTransitionException.class);
    }

    @Test
    void archive_fromDraft_moves_toArchived() throws Exception {
        assertArchiveSucceedsFrom(GoalStatus.DRAFT);
    }

    @Test
    void archive_fromActive_moves_toArchived() throws Exception {
        assertArchiveSucceedsFrom(GoalStatus.ACTIVE);
    }

    @Test
    void archive_fromCompleted_moves_toArchived() throws Exception {
        assertArchiveSucceedsFrom(GoalStatus.COMPLETED);
    }

    @Test
    void archive_fromArchived_isRejected() throws Exception {
        StrategicGoal goal = persisted(GoalStatus.ARCHIVED);
        UUID id = goal.getId();
        when(repository.findWithKpisById(id)).thenReturn(Optional.of(goal));
        assertThatThrownBy(() -> service.archive(id))
                .isInstanceOf(InvalidStatusTransitionException.class);
    }

    private void assertArchiveSucceedsFrom(GoalStatus from) throws Exception {
        StrategicGoal goal = persisted(from);
        UUID id = goal.getId();
        when(repository.findWithKpisById(id)).thenReturn(Optional.of(goal));
        assertThat(service.archive(id).status()).isEqualTo(GoalStatus.ARCHIVED);
    }

    @Test
    void delete_nonDraftGoal_isRejected() throws Exception {
        StrategicGoal goal = persisted(GoalStatus.ACTIVE);
        UUID id = goal.getId();
        when(repository.findWithKpisById(id)).thenReturn(Optional.of(goal));
        assertThatThrownBy(() -> service.delete(id))
                .isInstanceOf(BusinessRuleViolationException.class);
    }

    @Test
    void findById_missingId_throwsNotFound() {
        UUID id = UUID.randomUUID();
        when(repository.findWithKpisById(id)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.findById(id))
                .isInstanceOf(NotFoundException.class);
    }

    private StrategicGoal persisted(GoalStatus status) throws Exception {
        StrategicGoal goal = new StrategicGoal("T", "D",
                LocalDate.of(2026, 1, 1), LocalDate.of(2026, 12, 31), Priority.HIGH);
        goal.addKpi(new com.strateva.goal.domain.Kpi("k", new BigDecimal("10"), BigDecimal.ZERO, "%"));
        goal.setStatus(status);
        Field idField = goal.getClass().getSuperclass().getDeclaredField("id");
        idField.setAccessible(true);
        idField.set(goal, UUID.randomUUID());
        return goal;
    }
}
