package com.strateva.config;

import com.strateva.backlog.domain.Backlog;
import com.strateva.backlog.domain.BacklogItem;
import com.strateva.backlog.domain.BacklogRepository;
import com.strateva.backlog.domain.BacklogStatus;
import com.strateva.goal.domain.GoalStatus;
import com.strateva.goal.domain.Kpi;
import com.strateva.goal.domain.Priority;
import com.strateva.goal.domain.StrategicGoal;
import com.strateva.goal.domain.StrategicGoalRepository;
import com.strateva.task.domain.Task;
import com.strateva.task.domain.TaskRepository;
import com.strateva.task.domain.TaskStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.transaction.support.TransactionTemplate;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

/**
 * Populates a realistic Russian-language dataset on empty databases when the
 * {@code demo} profile is active. Idempotent: no-op if any goal already exists.
 */
@Configuration
@Profile("demo")
public class SampleDataSeeder {

    private static final Logger log = LoggerFactory.getLogger(SampleDataSeeder.class);

    @Bean
    public ApplicationRunner seedSampleData(StrategicGoalRepository goalRepo,
                                            BacklogRepository backlogRepo,
                                            TaskRepository taskRepo,
                                            TransactionTemplate tx) {
        return _ -> tx.executeWithoutResult(_ -> {
            if (goalRepo.count() > 0) {
                log.info("SampleDataSeeder: goals already present, skipping");
                return;
            }
            LocalDate today = LocalDate.now();

            StrategicGoal g1 = goal(goalRepo, "Выход на рынок СНГ",
                    "Запуск продуктовой линейки в трёх странах СНГ к концу года.",
                    today.minusDays(30), today.plusMonths(9), Priority.HIGH, GoalStatus.ACTIVE,
                    new Kpi("Доля рынка, %", bd("15.0"), bd("4.2"), "%"),
                    new Kpi("Новые клиенты", bd("500"), bd("128"), "шт."));

            StrategicGoal g2 = goal(goalRepo, "Цифровизация бухгалтерии",
                    "Перевести документооборот в электронный вид, снизить ручной труд.",
                    today.minusDays(60), today.plusMonths(6), Priority.MEDIUM, GoalStatus.ACTIVE,
                    new Kpi("Доля электронных документов", bd("95.0"), bd("62.5"), "%"),
                    new Kpi("Срок обработки, дней", bd("2.0"), bd("5.5"), "дн."));

            StrategicGoal g3 = goal(goalRepo, "Повышение удовлетворённости клиентов",
                    "Улучшить NPS и сократить время реакции службы поддержки.",
                    today.minusDays(15), today.plusMonths(12), Priority.CRITICAL, GoalStatus.SUBMITTED,
                    new Kpi("Индекс NPS", bd("60"), bd("42"), "балл"),
                    new Kpi("Время ответа, ч", bd("4"), bd("9.3"), "ч"));

            StrategicGoal g4 = goal(goalRepo, "Сокращение операционных расходов",
                    "Оптимизация закупок и логистики в масштабах компании.",
                    today.minusMonths(3), today.plusMonths(3), Priority.HIGH, GoalStatus.ACTIVE,
                    new Kpi("Снижение OPEX, %", bd("12.0"), bd("6.8"), "%"));

            StrategicGoal g5 = goal(goalRepo, "Обучение и развитие персонала",
                    "Запустить внутренний учебный портал и программы аттестации.",
                    today.minusDays(10), today.plusMonths(8), Priority.LOW, GoalStatus.DRAFT,
                    new Kpi("Сотрудники с аттестацией", bd("400"), bd("87"), "чел."));

            Backlog b1 = backlog(backlogRepo, "Бэклог MVP запуска СНГ", g1, BacklogStatus.SIGNED,
                    item("Локализация интерфейса на казахский и узбекский", Priority.HIGH),
                    item("Интеграция с локальными платёжными шлюзами", Priority.CRITICAL),
                    item("Юридическая проверка договоров", Priority.MEDIUM));
            b1.setSubmittedAt(Instant.now().minusSeconds(86400L * 20));
            b1.setSignedAt(Instant.now().minusSeconds(86400L * 14));
            b1.setSignedBy("pm");

            Backlog b2 = backlog(backlogRepo, "Электронный документооборот — фаза 1", g2, BacklogStatus.SUBMITTED,
                    item("Внедрение квалифицированной электронной подписи", Priority.HIGH),
                    item("Миграция архивов за 3 года", Priority.MEDIUM),
                    item("Обучение бухгалтеров работе с ЭДО", Priority.LOW));
            b2.setSubmittedAt(Instant.now().minusSeconds(86400L * 5));

            Backlog b3 = backlog(backlogRepo, "Программа улучшения поддержки", g3, BacklogStatus.DRAFT,
                    item("Внедрение круглосуточного чата", Priority.CRITICAL),
                    item("Автоматизация эскалации инцидентов", Priority.HIGH));

            Backlog b4 = backlog(backlogRepo, "Оптимизация закупок", g4, BacklogStatus.CANCELLED,
                    item("Тендер на нового поставщика упаковки", Priority.MEDIUM));
            b4.setCancelledAt(Instant.now().minusSeconds(86400L * 2));
            b4.setCancelledBy("pm");

            taskRepo.saveAll(List.of(
                task("Подготовить техническое задание локализации", g1, b1.getItems().get(0),
                    Priority.HIGH, today.plusDays(7), "emp", TaskStatus.IN_PROGRESS),
                task("Подписать договор с платёжным шлюзом", g1, b1.getItems().get(1),
                    Priority.CRITICAL, today.minusDays(2), "pm", TaskStatus.BLOCKED),
                task("Сверить условия договоров с юристами", g1, b1.getItems().get(2),
                    Priority.MEDIUM, today.plusDays(14), "ba", TaskStatus.TODO),
                task("Развернуть тестовый контур ЭДО", g2, b2.getItems().get(0),
                    Priority.HIGH, today.plusDays(10), "emp", TaskStatus.IN_PROGRESS),
                task("Составить план миграции архивов", g2, b2.getItems().get(1),
                    Priority.MEDIUM, today.plusDays(21), "ba", TaskStatus.TODO),
                task("Провести вебинар по ЭДО", g2, b2.getItems().get(2),
                    Priority.LOW, today.plusDays(30), "emp", TaskStatus.TODO),
                task("Подобрать подрядчика для круглосуточного чата", g3, b3.getItems().get(0),
                    Priority.CRITICAL, today.plusDays(5), "pm", TaskStatus.TODO),
                task("Описать матрицу эскалации", g3, b3.getItems().get(1),
                    Priority.HIGH, today.plusDays(12), "ba", TaskStatus.IN_PROGRESS),
                task("Отчёт по OPEX за квартал", g4, null,
                    Priority.MEDIUM, today.minusDays(5), "ba", TaskStatus.DONE),
                task("Сформировать требования к учебному порталу", g5, null,
                    Priority.LOW, today.plusDays(45), null, TaskStatus.TODO)
            ));

            log.info("SampleDataSeeder: seeded 5 goals, 4 backlogs, 10 tasks");
        });
    }

    private static StrategicGoal goal(StrategicGoalRepository repo, String title, String description,
                                      LocalDate start, LocalDate end, Priority priority,
                                      GoalStatus status, Kpi... kpis) {
        StrategicGoal g = new StrategicGoal(title, description, start, end, priority);
        g.setStatus(status);
        for (Kpi k : kpis) g.addKpi(k);
        return repo.save(g);
    }

    private static Backlog backlog(BacklogRepository repo, String title, StrategicGoal goal,
                                   BacklogStatus status, BacklogItem... items) {
        Backlog b = new Backlog(title, goal);
        b.setStatus(status);
        for (BacklogItem it : items) b.addItem(it);
        return repo.save(b);
    }

    private static BacklogItem item(String title, Priority priority) {
        return new BacklogItem(title, null, priority);
    }

    private static Task task(String title, StrategicGoal goal, BacklogItem item,
                             Priority priority, LocalDate deadline, String assignee, TaskStatus status) {
        Task t = new Task(title, null, goal, item, priority, deadline);
        t.setAssignedTo(assignee);
        t.setStatus(status);
        return t;
    }

    private static BigDecimal bd(String v) { return new BigDecimal(v); }
}
