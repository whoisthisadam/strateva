package com.strateva.backlog.service;

import com.strateva.backlog.domain.Backlog;
import com.strateva.backlog.domain.BacklogItem;
import com.strateva.backlog.domain.BacklogRepository;
import com.strateva.backlog.domain.BacklogStatus;
import com.strateva.backlog.web.dto.BacklogCreateRequest;
import com.strateva.backlog.web.dto.BacklogItemRequest;
import com.strateva.common.error.BusinessRuleViolationException;
import com.strateva.common.error.NotFoundException;
import com.strateva.goal.domain.Priority;
import com.strateva.goal.domain.StrategicGoal;
import com.strateva.goal.domain.StrategicGoalRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.lang.reflect.Field;
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
 * Unit tests for {@link BacklogService}: BR-2 is covered by controller-level tests,
 * here we verify the state machine (DRAFT → SUBMITTED → SIGNED; cancel from
 * DRAFT/SUBMITTED; SIGNED terminal), item-mutation guard (DRAFT only),
 * and the submit-with-no-items guard.
 */
class BacklogServiceTest {

    private BacklogRepository repository;
    private StrategicGoalRepository goalRepository;
    private BacklogService service;

    @BeforeEach
    void setUp() {
        repository = mock(BacklogRepository.class);
        goalRepository = mock(StrategicGoalRepository.class);
        service = new BacklogService(repository, goalRepository);
        when(repository.save(any(Backlog.class))).thenAnswer(inv -> inv.getArgument(0));
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("pm", "n/a",
                        List.of(new SimpleGrantedAuthority("ROLE_PROJECT_MANAGER"))));
    }

    private BacklogItemRequest itemReq(String title) {
        return new BacklogItemRequest(title, "desc", Priority.MEDIUM);
    }

    private StrategicGoal stubGoal() throws Exception {
        StrategicGoal g = new StrategicGoal("Goal", "d",
                LocalDate.of(2026, 1, 1), LocalDate.of(2026, 12, 31), Priority.HIGH);
        setField(g, "id", UUID.randomUUID());
        return g;
    }

    private Backlog persisted(BacklogStatus status, int itemCount) throws Exception {
        Backlog b = new Backlog("Бэклог", stubGoal());
        setField(b, "id", UUID.randomUUID());
        b.setStatus(status);
        for (int i = 0; i < itemCount; i++) {
            BacklogItem item = new BacklogItem("t" + i, "d", Priority.LOW);
            setField(item, "id", UUID.randomUUID());
            b.addItem(item);
        }
        return b;
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
    void create_withUnknownGoal_isRejected() {
        UUID unknown = UUID.randomUUID();
        when(goalRepository.findById(unknown)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.create(new BacklogCreateRequest("t", unknown, List.of())))
                .isInstanceOf(BusinessRuleViolationException.class)
                .hasMessageContaining("стратегическая цель");
    }

    @Test
    void create_succeedsWithDraftStatus_evenWithoutItems() throws Exception {
        StrategicGoal goal = stubGoal();
        when(goalRepository.findById(goal.getId())).thenReturn(Optional.of(goal));
        var response = service.create(new BacklogCreateRequest("Бэклог Q1", goal.getId(), List.of()));
        assertThat(response.status()).isEqualTo(BacklogStatus.DRAFT);
        assertThat(response.items()).isEmpty();
    }

    @Test
    void submit_fromDraftWithItems_moves_toSubmitted() throws Exception {
        Backlog b = persisted(BacklogStatus.DRAFT, 2);
        when(repository.findWithItemsById(b.getId())).thenReturn(Optional.of(b));
        var response = service.submitForApproval(b.getId());
        assertThat(response.status()).isEqualTo(BacklogStatus.SUBMITTED);
        assertThat(response.submittedAt()).isNotNull();
    }

    @Test
    void submit_fromDraftEmpty_isRejected() throws Exception {
        Backlog b = persisted(BacklogStatus.DRAFT, 0);
        when(repository.findWithItemsById(b.getId())).thenReturn(Optional.of(b));
        assertThatThrownBy(() -> service.submitForApproval(b.getId()))
                .isInstanceOf(BusinessRuleViolationException.class)
                .hasMessageContaining("хотя бы один элемент");
    }

    @Test
    void submit_fromSubmitted_isRejected() throws Exception {
        Backlog b = persisted(BacklogStatus.SUBMITTED, 1);
        when(repository.findWithItemsById(b.getId())).thenReturn(Optional.of(b));
        assertThatThrownBy(() -> service.submitForApproval(b.getId()))
                .isInstanceOf(BusinessRuleViolationException.class);
    }

    @Test
    void sign_fromSubmitted_recordsSignerAndTimestamp() throws Exception {
        Backlog b = persisted(BacklogStatus.SUBMITTED, 1);
        when(repository.findWithItemsById(b.getId())).thenReturn(Optional.of(b));
        var response = service.sign(b.getId());
        assertThat(response.status()).isEqualTo(BacklogStatus.SIGNED);
        assertThat(response.signedAt()).isNotNull();
        assertThat(response.signedBy()).isEqualTo("pm");
    }

    @Test
    void sign_fromDraft_isRejected() throws Exception {
        Backlog b = persisted(BacklogStatus.DRAFT, 1);
        when(repository.findWithItemsById(b.getId())).thenReturn(Optional.of(b));
        assertThatThrownBy(() -> service.sign(b.getId()))
                .isInstanceOf(BusinessRuleViolationException.class)
                .hasMessageContaining("«На согласовании»");
    }

    @Test
    void cancel_fromDraftAndFromSubmitted_isAllowed() throws Exception {
        Backlog draft = persisted(BacklogStatus.DRAFT, 1);
        when(repository.findWithItemsById(draft.getId())).thenReturn(Optional.of(draft));
        assertThat(service.cancel(draft.getId()).status()).isEqualTo(BacklogStatus.CANCELLED);

        Backlog submitted = persisted(BacklogStatus.SUBMITTED, 1);
        when(repository.findWithItemsById(submitted.getId())).thenReturn(Optional.of(submitted));
        var response = service.cancel(submitted.getId());
        assertThat(response.status()).isEqualTo(BacklogStatus.CANCELLED);
        assertThat(response.cancelledBy()).isEqualTo("pm");
        assertThat(response.cancelledAt()).isNotNull();
    }

    @Test
    void cancel_fromSigned_isRejected() throws Exception {
        Backlog b = persisted(BacklogStatus.SIGNED, 1);
        when(repository.findWithItemsById(b.getId())).thenReturn(Optional.of(b));
        assertThatThrownBy(() -> service.cancel(b.getId()))
                .isInstanceOf(BusinessRuleViolationException.class)
                .hasMessageContaining("не подписан");
    }

    @Test
    void addItem_onSubmitted_isRejected() throws Exception {
        Backlog b = persisted(BacklogStatus.SUBMITTED, 1);
        when(repository.findWithItemsById(b.getId())).thenReturn(Optional.of(b));
        assertThatThrownBy(() -> service.addItem(b.getId(), itemReq("new")))
                .isInstanceOf(BusinessRuleViolationException.class)
                .hasMessageContaining("«Черновик»");
    }

    @Test
    void findById_missingId_throwsNotFound() {
        UUID id = UUID.randomUUID();
        when(repository.findWithItemsById(id)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.findById(id)).isInstanceOf(NotFoundException.class);
    }
}
