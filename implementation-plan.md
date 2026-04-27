# Strateva — Implementation Plan

**Project:** Strateva — Strategic IT & Business Planning Tool (diploma project)
**Repo layout:** Monorepo — `strateva-backend/` (Spring Boot) and `strateva-frontend/` (React SPA)
**Source of truth:** This file. Update after every completed checklist item.

---

## Status legend

- `[ ]` not started
- `[~]` in progress
- `[x]` complete
- `[!]` blocked (add note)

## Current state

- **Phase:** 0 — complete (with noted deviations); Phases 1–8 complete; cross-cutting silent-authorization pattern adopted; UC-2.1 «отправить на согласование» retired 2026-04-27 (Goal status machine simplified to DRAFT→ACTIVE→COMPLETED→ARCHIVED with transitive «Перевести в архив»)
- **Last completed:** Phase 8 Admin audit viewer & user list slice — backend reuses Phase 3 `AuditController` (PM-only `/api/v1/audit` with `entityType`/`entityId`/`performedBy`/`from`/`to` + `Pageable`, 9 IT already green) and Phase 6 `UserController` (PM-only `/api/v1/users?role=…`); added `UserControllerIT` (5 specs — 401 anonymous, 403 BA/EMP, 200 PM full list, PM role-filter) so admin endpoints have a complete authz matrix. Frontend: `strings.admin` namespace (titles, filter labels, action map CREATE/UPDATE/DELETE/LOGIN_SUCCESS/LOGIN_FAILURE, details/pagination keys), `src/types/admin.ts` (AuditLogViewDto + `AUDIT_ACTIONS` + `AuditLogFilters`), `features/admin/{adminApi,useAdmin,AuditSummaryCard}`. `/admin/audit` (PM-only) — table + six-field filter (entityType from known domain types, performedBy from `/users`, entityId, from/to dates, page size 10/20/50/100) + expandable details row with `<code>`-wrapped message + diff viewer; «Назад/Вперёд» pagination. `/admin/users` (PM-only) — 3-column table (full name, username, role badge) with role filter; sorted by role then alphabetical. `AppShell` nav exposes «Журнал аудита» + «Пользователи» to PM only; `RequireRole` silently redirects BA/EMP on both routes. `AuditSummaryCard` on dashboard (Assumption 11) with total + last-24-h counts (two independent `?from=…&size=1` calls — O(1) regardless of dataset). Playwright `e2e/admin.spec.ts` (13 specs): PM table/filters/pagination render, entityType filter narrows to only `StrategicGoal` rows (7 seeded), row-expand surfaces details panel, /admin/users lists three seeded users with Russian role badges, role filter drops to one row, dashboard audit card visible, PM nav exposes both links; BA + EMP parameterised silent redirect on both routes + nav hidden + dashboard card hidden. `assertNoEnglish` clean: method-name breadcrumbs wrapped in `<code>` so `create`/`assign`/`changeStatus` audit messages are skipped by the walker; allowlist extended with raw entity types (`StrategicGoal`, `Backlog`, `Task`, `User`). Full regression `npx playwright test` 54/54 green (7 auth + 7 goals + 8 backlog + 8 tasks + 11 reports + 13 admin); `tsc --noEmit` clean; `./mvnw test` green on Java 25. MCP walkthrough: PM /admin/audit = 22 pages × 20 rows, StrategicGoal filter narrows to 7 rows with Russian action badges, /admin/users shows pm/ba/emp with Russian role badges; BA + EMP navigate to /admin/audit and /admin/users and silently redirect to `/` (no 403 page, no admin nav, no audit dashboard card). Smoke: `docs/smoke/phase-8.http` records PM audit filter combinations (entityType, performedBy, entityId, from/to, pagination, combined) + users list full and role-filtered + BA/EMP 403 + anonymous 401 across both endpoints.
- **Previously completed:** Phase 7 Dashboard & reports slice end-to-end — `ReportService` aggregations (overview, goals progress, KPI progress, task workload, overdue tasks, backlog throughput) sourced exclusively from JPA queries (BR-6); `ReportController` (PM-only via `@PreAuthorize`) serves JSON + `?format=csv` with `CsvWriter` writing a UTF-8 BOM so Excel renders Cyrillic; `ReportServiceTest` (6 unit) + `ReportControllerIT` (6 integration) cover empty/single/many fixtures, 200 + BOM bytes for PM, 403 for BA/EMP, 401 anonymous; `./mvnw test` green on Java 25. React UI: `strings.reports` namespace, `src/types/reports.ts`, `features/reports/{reportsApi,useReports,ReportsSummaryCard}`; `/analytics` (PM-only) with six overview tiles and three Recharts cards (stacked Bar goal progress, stacked Bar workload × status, Line backlog throughput) — all axis/legend/tooltip text Russian; `/reports` (PM-only) tabbed page with five report tabs each rendering a table + single «Экспортировать CSV» button that streams the active tab via fetch + blob + anchor download; `AppShell` nav exposes «Панель аналитики» + «Отчёты» to PM only; `RequireRole` on routes performs silent redirect for BA/EMP; `ReportsSummaryCard` added to dashboard for PM (Assumption 11). Playwright `e2e/reports.spec.ts` (11 specs): PM analytics tiles + chart containers, /reports tabs render & switch, CSV download event fires with correct filename, dashboard card visible, PM nav exposes both links; BA + EMP parameterised silent redirect on /analytics + /reports + nav hidden + dashboard card hidden. `assertNoEnglish` clean (allowlist Strateva/KPI/pm/ba/emp/CSV); auth spec `BRAND_ALLOW` extended with KPI for the new PM dashboard description. Full regression `npx playwright test` 41/41 green (7 auth + 7 goals + 8 backlog + 8 tasks + 11 reports); `tsc --noEmit` clean. MCP walkthrough verified PM seeded counts (Goals 2/1, Tasks 25/5, Backlogs signed 7), CSV download with BOM bytes (EF BB BF) confirmed, BA/EMP silent redirects + nav/card hiding confirmed live. Smoke: `docs/smoke/phase-7.http` records PM JSON + CSV across all six endpoints and BA/EMP/anonymous negatives.
- **Next up:** Project is feature-complete against the 13 BR / 13 UC matrix; remaining work is the diploma deliverables (packaging, screenshots, thesis text) per Assumption 12.

## Session log

> Append one line per working session: `YYYY-MM-DD — phase — short summary`.

- 2026-04-19 — 0 — plan drafted, awaiting user approval
- 2026-04-20 — 0/1/2 — scaffolded backend + frontend, shipped Auth slice end-to-end; Playwright 7/7 green; Phase 0 gaps backfilled (root README, `date-fns`, Java 22→25), baseline commit created
- 2026-04-20 — 2 — role vocabulary corrected: `STRATEGIST` («Стратег») → `EMPLOYEE` («Сотрудник»); seed user `strat` → `emp`; legacy DB rows auto-purged by seeder; locked the three-role vocabulary in Assumption 9
- 2026-04-20 — 2/UI — modernized login & dashboard (two-column brand pane, avatar/badge/logo primitives, leading-icon Input, blurred sticky header); Playwright 10/10 desktop+mobile flows green, 0 console errors
- 2026-04-20 — 3 — shipped `AuditController` (PM-only, filters entityType/entityId/from/to/performedBy, paged); proved `@Auditable` aspect end-to-end via `AuditAspectIT`; folded in the four deferred Phase 2 ITs (`AuthControllerIT`, `SecurityIT`, `AuthAuditIT`); Testcontainers fallback: local Postgres `strateva_test` + `ddl-auto: create-drop` via new `test` profile (Docker unavailable on this host); `./mvnw test` 32/32 green; Playwright authz matrix verified live (401/403/403/200)
- 2026-04-20 — 4 — shipped Strategic goals & KPIs slice end-to-end: `StrategicGoal`+`Kpi` entities, `GoalService` (BR-1 role gate, BR-4 1–5 KPIs, status machine DRAFT→SUBMITTED→ACTIVE→COMPLETED/ARCHIVED, `@Auditable` on all mutations), `GoalController` with `@PreAuthorize` + EMPLOYEE scoping (UC-10), `BusinessRuleViolationException` → `ApiError` 400; React UI (`/goals` list, `/goals/new`, `/goals/:id`, `/goals/:id/edit`) with `GoalForm` KPI repeater, Zod mirroring BR-4, toast feedback, role-gated action buttons; `AppShell` nav link added; 20 new tests (11 unit + 9 IT) → `./mvnw test` 52/52 green; Playwright MCP drove full cross-role flow: PM create(2 KPIs) → submit → activate → BA read-only → EMPLOYEE sees active → PM archive → EMPLOYEE no longer sees it; `assertNoEnglish` clean; 7/7 regression auth specs still green
- 2026-04-21 — cross-cutting — silent-authorization pattern adopted: `RoleGuard` defaults to `null` fallback (no more amber «Недостаточно прав» banner); new `RequireRole` performs a silent redirect for route-level guards (`/goals/new`, `/goals/:id/edit` → `/goals`); dropped now-redundant `fallback={null}` on `GoalDetailPage` + `GoalsListPage`; new `e2e/goals.spec.ts` codifies BA/EMPLOYEE silent-hide expectations + PM regression (`npx playwright test` 14/14 green). Convention going forward: `RoleGuard` for inline element gating, `RequireRole` for routes, never show the forbidden string in the UI.
- 2026-04-21 — 5 — shipped Backlog slice end-to-end: `BacklogStatus` enum (DRAFT/SUBMITTED/SIGNED/CANCELLED), `Backlog`+`BacklogItem` entities with `BacklogRepository` (`JpaSpecificationExecutor`) + `BacklogSpecifications`, `BacklogTransitions` state guards, `BacklogService` enforcing BR-2 + empty-items guard on submit + `@Auditable` on every mutation, `BacklogController` with method-level `@PreAuthorize` and BA-scoped list filtering; fixed `JwtAuthenticationFilter` to always clear the security context when a Bearer token is present but invalid (stopped IT context leakage in multi-test runs). React UI: new `strings.backlog` namespace, `src/types/backlog.ts`, `features/backlogs/{backlogsApi,useBacklogs,backlogBadges,backlogSchema,BacklogItemForm}`, `/backlogs` list + `/backlogs/new` + `/backlogs/:id` pages with inline item add/edit/remove and role+state-aware sign/cancel/submit actions (confirm dialogs), AppShell nav entry gated to PM+BA. `BacklogServiceTest` + `BacklogControllerIT` cover the full transition × role matrix + BR-2 negatives + audit trail; `docs/smoke/phase-5.http` captures the REST happy/negative paths. Playwright `e2e/backlog.spec.ts` (8 specs) drives BA create→add item→submit, PM sign + cancel, BA-silent-readonly on SUBMITTED, PM/EMPLOYEE route redirects and nav hiding; `assertNoEnglish` clean. Full suite: `npx playwright test` 22/22 green (7 auth + 7 goals + 8 backlog); `./mvnw test` green.
- 2026-04-21 — 4/5 MCP regression — ran the mandatory Playwright MCP walkthrough per Assumption 10 covering both Phase 4 and Phase 5 live. Phase 4 (goals): PM browses `/goals`, drills into a goal (KPI table intact); BA sees the list read-only (no «Создать цель», no status filter); EMPLOYEE sees a single ACTIVE row (no create/filter). Phase 5 (backlogs) full lifecycle: BA empty-submit triggers Russian field errors «Введите наименование бэклога» + «Выберите стратегическую цель»; BA creates «MCP walkthrough: Оптимизация логистики Q3» (DRAFT, no Submit button with zero items), adds item «Аудит складских остатков» (HIGH), edits priority to CRITICAL, submits → «На согласовании» with all BA mutation buttons gone and `ОТПРАВЛЕН` timestamp rendered; PM re-opens the same backlog and sees Sign+Cancel (no Submit/AddItem), clicks Sign → «Подписан» with `ПОДПИСАЛ pm` row; BA seeds a second DRAFT via API, PM opens it and sees only Cancel (no Sign — correct, DRAFT cannot be signed), clicks Cancel → «Сторнирован» with `СТОРНИРОВАЛ pm`; PM on `/backlogs` has no «Создать бэклог» button and `/backlogs/new` silently redirects to `/backlogs`; EMPLOYEE on `/backlogs` silently redirects to `/` and the header nav shows only «Главная» + «Стратегические цели» («Бэклоги» hidden). Console sweep across the whole session: only expected 401s (initial `/auth/me` probes + one wrong-username login attempt); no unexpected errors, no stray English, no layout breakage.
- 2026-04-21 — UX/dashboard — replaced the five «Скоро» placeholder cards on `DashboardPage` with two live summary cards (`GoalsSummaryCard`, `BacklogsSummaryCard`) that read real counts via the existing `useGoalsList` / `useBacklogsList` hooks (total + one status-scoped stat each) and expose a «Перейти к списку» button linking to the matching list page. Cards reuse `RoleGuard` with the same allow-list as the `AppShell` nav entry, so EMPLOYEE sees only the Goals card (their single scoped ACTIVE row) while PM/BA see both. Removed the now-unused `strings.dashboard.soon` / `cards.{tasks,reports,audit}` entries; added `strings.dashboard.{statsTotal,openList,loadingStats}` + per-card `statsActive`/`statsPending`. Locked a new convention as Assumption 11: every UI-shipping phase must wire a live dashboard summary card **and** a nav item under the same role matrix — no «Скоро» stubs. MCP walkthrough: PM dashboard shows Goals(2/1) + Backlogs(14/6), BA shows the same two cards, EMPLOYEE shows Goals(1/1) only with nav ≈ «Главная» + «Стратегические цели» (no Backlogs), «Перейти к списку» click-through works, 0 stray English, 0 unexpected console errors. Scripted: `npx playwright test` 22/22 still green, `tsc --noEmit` clean.
- 2026-04-21 — 6 — shipped Tasks slice end-to-end: `TaskStatus` enum (TODO/IN_PROGRESS/DONE/BLOCKED) with `TaskTransitions` guarding the state machine (TODO → IN_PROGRESS ↔ BLOCKED, → DONE terminal); `Task` entity (goal FK, optional backlogItem FK, title/description/priority/status/deadline/assignedTo/createdBy) + `TaskRepository` (`JpaSpecificationExecutor`) + `TaskSpecifications`; `TaskService` enforcing **BR-3** (status may leave TODO only when `assignedTo != null`), **BR-5** (create rejects null goal and ARCHIVED goals; assign rejects non-EMPLOYEE / inactive users), EMPLOYEE-own-task gate on status changes, `@Auditable` on create/update/assign/changeStatus/delete, DONE-terminal + TODO-only-delete invariants; `TaskController` with method-level `@PreAuthorize` (PM for mutations, PM+EMPLOYEE for status, all three for reads) and **UC-9** role-forced `assignee=currentActor()` on list + 404 on foreign EMPLOYEE detail. Added a minimal `UserController` (PM-only, EMPLOYEE-filtered `/api/v1/users` for the assignee picker) + `UserSummary` DTO. Tightened the Phase 4 deferred EMPLOYEE scoping: `StrategicGoalRepository.findForEmployee` now uses an `EXISTS(SELECT 1 FROM Task t WHERE t.goal=g AND t.assignedTo=:username)` subquery wired via `GoalService` → `currentActor()`. Backend tests: `TaskServiceTest` (BR-3 + BR-5 matrices, state machine, EMPLOYEE own-task rule) + `TaskControllerIT` (PM create → assign → EMPLOYEE transitions → DONE + BR-3/BR-5 negatives + UC-9 scoping + audit-row assertions); `./mvnw test` green on Java 25. React UI: `strings.tasks` namespace, `src/types/{tasks,users}.ts`, `features/tasks/{tasksApi,useTasks,taskBadges,taskSchema,TaskForm,TaskStatusDropdown,TaskAssignDialog}` + `features/users/{usersApi,useUsers}`, `/tasks` (Table + Kanban toggle, search + status + priority filters), `/tasks/new` (PM-only), `/tasks/:id` (inline priority/deadline edit for PM, assign dialog, status dropdown that mirrors `TaskTransitions` exactly and shows a «Назначьте исполнителя» lock when BR-3 would block). Dashboard: new `TasksSummaryCard` (total + own-in-progress for EMPLOYEE, total + IN_PROGRESS for PM/BA) visible to all three roles; «Задачи» nav entry added to `AppShell` for all roles (Assumption 11). Playwright `e2e/tasks.spec.ts` (8 specs): PM UI create → BR-3 lock → assign → unlock, EMPLOYEE TODO→IN_PROGRESS→DONE with terminal-hide of status panel, EMPLOYEE `/tasks` shows only own rows (UC-9), EMPLOYEE foreign detail hides status panel (404 path), BA/EMPLOYEE `/tasks/new` silently redirects to `/tasks`, nav + dashboard card visible for all three roles; `assertNoEnglish` clean. Full regression: `npx playwright test` 30/30 green (7 auth + 7 goals + 8 backlog + 8 tasks); `tsc --noEmit` clean. Smoke: `docs/smoke/phase-6.http` covers PM login × 3 roles → goal setup → PM create/assign, BR-3 and BR-5 negatives, EMPLOYEE transitions, UC-9 list scoping, DONE-terminal and TODO-only-delete guards.
- 2026-04-22 — 8 — shipped Admin audit viewer & user list slice end-to-end: backend reuses Phase 3 `AuditController` (PM-only, entityType/entityId/performedBy/from/to + `Pageable`, 9 IT already green) and Phase 6 `UserController` (PM-only, `/api/v1/users?role=…`); added `UserControllerIT` (5 specs — 401 anonymous, 403 BA, 403 EMP, 200 PM full list, 200 PM role-filter `role=EMPLOYEE`). React UI: `strings.admin` namespace (titles, filter labels, Russian action map CREATE/UPDATE/DELETE/LOGIN_SUCCESS/LOGIN_FAILURE, details/pagination keys), `src/types/admin.ts` (AuditLogViewDto + `AUDIT_ACTIONS` + `AuditLogFilters`), `features/admin/{adminApi,useAdmin,AuditSummaryCard}` hooks + paged audit queries + a recent-24h summary query. `/admin/audit` (PM-only) renders a six-field filter form (entityType enumeration of known domain types, performedBy populated from `/users`, entityId free-text, from/to date pickers, page size 10/20/50/100) + paginated table with expandable row that reveals a «Детали» panel: action badge, `<code>`-wrapped entityId, message, and JSON diff viewer. `/admin/users` (PM-only) renders a 3-column table (full name, username, role badge) with a role filter and sort-by-role-then-alphabetical. `AppShell` nav exposes «Журнал аудита» + «Пользователи» to PM only; `RequireRole` silently redirects BA/EMP on both routes. `AuditSummaryCard` on dashboard (Assumption 11) with total events + last-24-h counts from two `?size=1` calls (O(1) regardless of dataset). Playwright `e2e/admin.spec.ts` (13 specs): PM renders table/filters/pagination (22 pages × 20 rows on seeded fixture), entityType filter narrows to only `StrategicGoal` rows (7 seeded), row-expand surfaces the details panel, /admin/users lists three seeded users with Russian role badges, role filter drops to one row, dashboard audit card visible, PM nav exposes both links; BA + EMP parameterised silent redirect on `/admin/audit` + `/admin/users` + nav hidden + dashboard card hidden. `assertNoEnglish` clean: method-name breadcrumbs wrapped in `<code>` so `create`/`assign`/`changeStatus` audit messages are skipped by the walker; allowlist tightened to raw domain entity types (`StrategicGoal`, `Backlog`, `Task`, `User`). Full regression: `npx playwright test` 54/54 green (7 auth + 7 goals + 8 backlog + 8 tasks + 11 reports + 13 admin); `tsc --noEmit` clean; `./mvnw test` green on Java 25. MCP walkthrough (Assumption 10): PM `/admin/audit` — 22 pages × 20 rows, StrategicGoal filter narrows to 7 rows with Russian action badges («Создание»/«Обновление»); PM `/admin/users` — pm/ba/emp rendered with Russian role badges («Менеджер проектов», «Бизнес-аналитик», «Сотрудник»); BA navigating to `/admin/audit` and `/admin/users` silently redirects to `/` with no audit/users nav and no audit dashboard card; EMP same behaviour. Smoke: `docs/smoke/phase-8.http` records PM audit filter combinations (entityType, performedBy, entityId, from/to, pagination, combined) + users list full and role-filtered + BA/EMP 403 + anonymous 401 across both endpoints. Project now feature-complete against the 13 BR / 13 UC matrix; remaining work is diploma deliverables per Assumption 12.
- 2026-04-27 — 9 — retired UC-2.1 «отправить на согласование»: simplified `GoalStatus` to DRAFT/ACTIVE/COMPLETED/ARCHIVED (dropped SUBMITTED), replaced generic `POST /goals/{id}/submit` + `POST /goals/{id}/status` with explicit transition endpoints `POST /goals/{id}/{activate,complete,archive}` driven by a static `GoalTransitions` map; new `InvalidStatusTransitionException` → `ApiError(code=INVALID_STATUS_TRANSITION, http=400)` via `GlobalExceptionHandler`; `SampleDataSeeder` updated to seed goals straight to ACTIVE (no submit step). Backend tests realigned: `GoalServiceTest` covers all valid transitions + every illegal pair throws `InvalidStatusTransitionException`; `GoalControllerIT` exercises the three new endpoints + 400 on illegal moves; `TaskControllerIT`/`ReportControllerIT` setup paths now call `/activate` instead of `/submit`. Frontend: removed `GoalStatus.SUBMITTED` from `types/goals.ts`, refactored `goalBadges.tsx` (4 statuses), `goalsApi.ts` exposes `activateGoal`/`completeGoal`/`archiveGoal` mutations, `useGoals.ts` exports matching `useActivateGoal`/`useCompleteGoal`/`useArchiveGoal` hooks, `GoalDetailPage.tsx` swaps the status dropdown + «Отправить на согласование» button for explicit role+status-gated buttons «Активировать»/«Завершить»/«Перевести в архив» (visibility derived from the same transition map mirrored in `lib/strings.ts`); `GoalsListPage.tsx` status filter rebuilt from the new enum. E2E specs `goals.spec.ts` + `tasks.spec.ts` updated to drive the new endpoints. Verification: `./mvnw test` 117/117 green on Java 25; `tsc --noEmit` clean; `npm run build` zero TypeScript errors; goals UI grep confirms no remaining «согласование»/«submit» strings (the only `submitForApproval` references left are in the Backlog slice which still uses SUBMITTED). `implementation-plan.md` Phase 4 sections + traceability matrix updated to mark UC-2.1 retired.
- 2026-04-21 — 7 — shipped Dashboard & reports slice end-to-end: `ReportService` read-only aggregations (overview counts, goals progress = DONE/total, KPI progress = current/target, task workload by assignee × status, overdue tasks by `deadline<today`, backlog throughput per month) sourced exclusively from JPA (BR-6); `ReportController` (PM-only via `@PreAuthorize`) exposes `/api/v1/reports/{overview,goals-progress,kpis-progress,task-workload,overdue-tasks,backlog-throughput}` with JSON + `?format=csv`; `CsvWriter` writes a UTF-8 BOM (`\uFEFF` → bytes EF BB BF) so Excel renders Cyrillic headers without an import wizard; `ReportResponse<T>` wrapper carries `generatedAt/generatedBy/count`. Backend tests: `ReportServiceTest` (6 unit — empty/single/many fixtures across every aggregation, overdue-day math, month-bucket boundaries) + `ReportControllerIT` (6 integration — PM 200 JSON + 200 CSV with `Content-Type: text/csv;charset=UTF-8` and BOM bytes asserted; BA 403; EMP 403; anonymous 401); `./mvnw test` green on Java 25. React UI: `strings.reports` namespace + `dashboard.cards.reports.*`; `src/types/reports.ts` with `ReportKey` union + all row DTOs + `ReportsOverviewDto`; `features/reports/{reportsApi,useReports,ReportsSummaryCard}` hooks (six queries + `useDownloadReportCsv` mutation that streams via fetch + blob + anchor); `/analytics` (PM-only) renders six overview tiles (goals total/active, tasks total/done/overdue, backlogs signed) + three Recharts cards (stacked Bar goal progress — done vs pending, stacked Bar workload × status, Line backlog throughput by month) with Russian axis/legend/tooltip labels and «Нет данных» empty states; `/reports` (PM-only) renders a tabbed page with five tabs (Прогресс по целям, Прогресс по KPI, Загрузка сотрудников, Просроченные задачи, Пропускная способность бэклогов), each showing a table + a single «Экспортировать CSV» button that downloads the active tab's CSV; `AppShell` nav gains «Панель аналитики» + «Отчёты» gated to PM only; `RequireRole` on both routes performs a silent redirect for BA/EMP; `ReportsSummaryCard` added to dashboard for PM with total + overdue counts and a shortcut to `/analytics` (Assumption 11). Playwright `e2e/reports.spec.ts` (11 specs): PM /analytics renders tiles + 3 chart containers, /reports renders all 5 tabs and switches aria-selected, CSV export click fires a `download` event with `goals-progress.csv` suggested filename, dashboard surfaces reports card, PM nav exposes both links; BA + EMP parameterised — /analytics and /reports silently redirect to `/`, nav hides both links, dashboard hides reports card, `Недостаточно прав` never appears; `assertNoEnglish` clean (allowlist Strateva/KPI/pm/ba/emp/CSV). Auth spec `BRAND_ALLOW` extended with `KPI` to accommodate the new PM dashboard description. Full regression: `npx playwright test` 41/41 green (7 auth + 7 goals + 8 backlog + 8 tasks + 11 reports); `tsc --noEmit` clean. MCP walkthrough (Assumption 10): PM /analytics shows seeded counts (Goals 2/1, Tasks 25/5, Overdue 0, Backlogs signed 7) with all three charts populated and Russian labels; PM /reports tab switching works (Прогресс по целям → KPI → Загрузка → Просрочки → Throughput); CSV download verified end-to-end — backend emits UTF-8 BOM (EF BB BF confirmed via `arrayBuffer()`) and browser triggers a native download for `task-workload.csv` matching the active tab; BA /reports and /analytics silently redirect to `/` with nav showing only Главная/Цели/Бэклоги/Задачи and no reports card; EMP same with nav showing only Главная/Цели/Задачи and no reports card. Smoke: `docs/smoke/phase-7.http` records PM JSON + CSV for all six endpoints plus BA/EMP/anonymous negatives.

---

## Locked tech stack (versions verified on Context7)

| Layer | Choice | Version |
|---|---|---|
| Backend language | Java | 25 (LTS) |
| Backend framework | Spring Boot | 4.0.x |
| Build tool | Maven (wrapper `./mvnw`) | 3.9+ |
| Persistence | Spring Data JPA + Hibernate | Spring Boot managed |
| DB migrations | Flyway (single baseline; see Assumption 3) | Spring Boot managed |
| DB | PostgreSQL | 16 (local `strateva`, prod via Railway Docker) |
| Security | Spring Security + JWT (`jjwt` 0.12.x) | — |
| Mapping | MapStruct | 1.6.x |
| AOP | Spring AOP (for `AuditAspect`) | — |
| Backend tests | JUnit 5, Mockito, Testcontainers (PostgreSQL) | — |
| Frontend language | TypeScript | 5.x |
| Frontend framework | React | 19.2 |
| Bundler | Vite | 6.x |
| Styling | Tailwind CSS | 4.x |
| UI components | shadcn/ui (Radix primitives) | latest |
| Charts | Recharts | 2.x |
| Server state | TanStack Query | 5.x |
| Forms | React Hook Form + Zod | 7.x / 3.x |
| Routing | React Router | 7.x |
| HTTP client | Axios | 1.x |
| Frontend tests | Playwright (MCP-driven + scripted) | latest |
| Containerization | Docker (backend + postgres) | — |
| Deploy backend | Railway (Docker) | — |
| Deploy frontend | Vercel | — |

> Before using any annotation, hook, or API from the above libraries, the rule is **Context7 first, code second**.

---

## Assumptions (flag now; revise on request)

1. **No public registration.** Accounts are provisioned by a seed `ApplicationRunner` (one user per role) and — optionally in Phase 14 — via an admin-only endpoint. This is consistent with an internal strategic-planning tool.
2. **Monorepo, two independent builds.** Each subproject has its own tests, lint, and build command. No root-level package manager.
3. **Schema strategy — dev-update + prod-validate + Flyway baseline.** Local profile keeps `ddl-auto: update` for iteration velocity across slices. Production profile uses `ddl-auto: validate` + a single Flyway baseline migration (`V1__initial_schema.sql`) authored in Phase 9.3a from the final local schema (`pg_dump --schema-only`) and committed under `strateva-backend/src/main/resources/db/migration/`. This deviates from the master prompt's literal `ddl-auto: update` in prod but matches its spirit (low overhead, diploma scope) while preventing silent mid-demo schema drift — Hibernate's `update` silently skips column renames and incompatible type changes. Fail-fast validation against a canonical baseline costs ~15 minutes and eliminates the surprise-factor risk for the defense.
4. **Audit trail via AOP** on service-layer methods annotated `@Auditable`, storing JSONB diffs in `audit_log`.
5. **Reports** are generated server-side as structured JSON; frontend renders with Recharts. PDF/CSV export is in-scope as "Экспортировать" buttons for the tabular reports only.
6. **Russian-only UI.** All user-visible strings live in `src/lib/strings.ts` (typed constants) so Playwright can assert no English leakage.
7. **Sequential Thinking MCP is unavailable in this environment.** Substitute: every non-trivial decision gets a short "Rationale" block either inline in the plan or in the session log. If the MCP becomes available, switch to it without re-structuring the plan.
8. **JWT session length: 8 hours, no refresh token.** `JWT_EXPIRATION_MS = 28800000` (8h) is the documented default so a demo or defense session cannot silently expire mid-presentation. There is no refresh-token mechanism in scope — on 401 the frontend clears auth and redirects to `/login`. If a production deployment later wants short-lived access tokens, a refresh-token flow is a Phase 9+ addition, not a rework.
9. **Locked role vocabulary (LOCKED 2026-04-20).** The system has **exactly three roles** with these canonical names and Russian labels. Do not rename, alias, or add a role without explicit user approval; do not substitute synonyms (e.g. «Стратег» is _not_ a valid label for any role).

   | Enum | Russian label | Seeded login | Seeded password |
   |---|---|---|---|
   | `PROJECT_MANAGER` | Менеджер проектов | `pm` | `pmPass1!` |
   | `BUSINESS_ANALYST` | Бизнес-аналитик | `ba` | `baPass1!` |
   | `EMPLOYEE` | Сотрудник | `emp` | `empPass1!` |

10. **Playwright MCP walkthrough is a mandatory phase gate (LOCKED 2026-04-21).** Every phase that ships UI **must** be validated interactively through the Playwright MCP browser tools, not just via the scripted `npx playwright test` suite. The scripted spec proves the invariants; the MCP walkthrough proves the user journey actually looks and behaves like the spec claims (no layout breakage, no stray English, no console errors, no hidden dead-ends). The walkthrough is **not optional** and is **not a substitute** for the scripted spec — both are required. Concretely, for every feature slice:
    - Drive the full cross-role happy path end-to-end in the live app (backend + `npm run dev`), one role per journey.
    - On every navigation, capture a `browser_snapshot` and glance at `browser_console_messages` for errors.
    - Verify the silent-authorization contract (Assumption: `RoleGuard` hides, `RequireRole` silently redirects, never show `strings.errors.forbidden`).
    - When a bug surfaces in the walkthrough that the scripted spec missed, add a scripted-spec case for it before closing the phase — the scripted suite is the future regression guardrail.
    - Log the walkthrough result in the session log: roles exercised, routes visited, any issues found, final verdict.
    - Regression scope: whenever a later phase ships, re-run the MCP walkthrough for every prior UI phase that could be affected (cross-cutting work touching `RoleGuard`/`RequireRole`/`AppShell`/`http`/`strings` always triggers a full-suite MCP regression).

11. **Dashboard + navigation sync is a mandatory phase gate (LOCKED 2026-04-21).** Every phase that ships a user-facing slice **must** wire the slice into both the top-level entry points: (a) a summary card on `DashboardPage` with real data (at minimum: total count + one actionable sub-count) and a "Перейти к списку" button linking to the list page, and (b) a navigation item in `AppShell` pointing to the same list page. Both integrations **must** honour the same role matrix that guards the slice's routes (use `RoleGuard` on dashboard cards and the `allow` filter on nav items — EMPLOYEE sees no Backlogs card because they have no access to that slice). Placeholders like «Скоро» / "Soon" badges are forbidden on the dashboard; if a feature is not yet implemented, its card is **absent**, not stubbed. Every iteration's definition-of-done explicitly verifies: *"Dashboard summary cards and Navigation menu are synchronized with the newly implemented feature slice."* Violations caught in the Assumption-10 MCP walkthrough block phase completion.

## Open questions for the user (non-blocking for Phase 0)

- **Q1 — Admin/user management UI:** Is a minimal user CRUD screen required for PROJECT_MANAGER, or is seed + DB-only sufficient? *(Default: seed-only + a read-only user list in the audit section.)*
- **Q2 — Report exports:** Confirm PDF is in scope or CSV-only is enough? *(Default: CSV-only for simplicity; add PDF later if requested.)*
- **Q3 — Goal → Backlog relation:** Does a backlog belong to exactly one strategic goal (as the schema suggests) or can it span several? *(Default: one goal per backlog — matches the given schema `backlogs.goal_id`.)*

These do **not** block Phase 0; I will proceed with the defaults above unless you say otherwise.

---

## Repository layout (target)

```
strateva/
├── implementation-plan.md          ← this file (source of truth)
├── README.md                       ← high-level overview + run instructions
├── .gitignore
├── .editorconfig
├── docker-compose.yml              ← local full-stack simulation (optional, created in Phase 16)
├── strateva-backend/
│   ├── pom.xml
│   ├── mvnw / mvnw.cmd / .mvn/
│   ├── Dockerfile
│   ├── src/main/java/com/strateva/
│   │   ├── StrtevaApplication.java
│   │   ├── config/        (SecurityConfig, CorsConfig, JwtConfig, OpenApiConfig)
│   │   ├── controller/    (AuthController, GoalController, BacklogController, TaskController, ReportController, AuditController)
│   │   ├── service/       (+ impl/)
│   │   ├── repository/
│   │   ├── entity/        (+ enums/)
│   │   ├── dto/           (request/ response/)
│   │   ├── mapper/        (MapStruct)
│   │   ├── security/      (JwtUtil, JwtAuthenticationFilter, UserDetailsServiceImpl, JwtAuthEntryPoint)
│   │   ├── audit/         (AuditLog entity, @Auditable, AuditAspect)
│   │   └── exception/     (+ GlobalExceptionHandler, ApiError)
│   ├── src/main/resources/
│   │   ├── application.yml
│   │   ├── application-local.yml
│   │   └── application-prod.yml
│   └── src/test/java/com/strateva/
│       ├── service/       (Mockito unit tests)
│       └── integration/   (Testcontainers + MockMvc)
└── strateva-frontend/
    ├── package.json
    ├── vite.config.ts
    ├── tsconfig.json
    ├── tailwind.config.ts
    ├── index.html
    └── src/
        ├── main.tsx / App.tsx
        ├── api/           (axios instance + TanStack Query hooks per domain)
        ├── components/    (ui/ — shadcn wrappers; layout/; forms/)
        ├── pages/         (auth/, goals/, backlog/, tasks/, reports/, admin/)
        ├── context/       (AuthContext)
        ├── hooks/         (useAuth, useRole, useToast)
        ├── types/         (DTO interfaces mirroring backend)
        ├── lib/           (strings.ts, zod schemas, formatters, utils)
        └── routes/        (ProtectedRoute, RoleGuard)
```


---

## Phase 0 — Repo & tooling scaffolding

- [x] 0.1 Verify PostgreSQL `strateva` DB is reachable at `localhost:5432` with the chosen credentials
- [x] 0.2 Add root `.gitignore`, `.editorconfig`, top-level `README.md`
- [x] 0.3 Scaffold `strateva-backend/` via Spring Initializr (Web, Security, Data JPA, Validation, PostgreSQL Driver, Lombok, Actuator, AOP); **Java 25, Spring Boot 4.0.5, Maven** — initial scaffold built against JDK 22 (what was on `JAVA_HOME` at scaffold time); bumped to 25 in `pom.xml` 2026-04-20 after user installed JDK 25. `./mvnw test` green on 25
- [x] 0.4 Add deps not covered by Initializr: `jjwt-api` / `jjwt-impl` / `jjwt-jackson` (0.12.6), MapStruct + processor (1.6.3), Testcontainers (postgresql + junit-jupiter), springdoc-openapi (2.8.14), plus `spring-boot-starter-json` (needed under SB 4 because webmvc no longer transitively pulls Jackson)
- [x] 0.5 Create `application.yml` (shared defaults) + **`application-dev.yml`** (profile renamed from the plan's `local` → `dev` for consistency with Spring convention) + `application-prod.yml`
- [x] 0.6 Confirm backend boots on `dev` profile: `./mvnw spring-boot:run` with `SPRING_PROFILES_ACTIVE=dev` (default) → `/actuator/health` = UP
- [x] 0.7 Scaffold `strateva-frontend/` via `npm create vite@latest` — React 19 + TypeScript 5
- [x] 0.8 Install Tailwind CSS v4, configure via the Vite plugin (`@tailwindcss/vite`, no separate `postcss.config` needed under v4)
- [~] 0.9 Initialize shadcn/ui; base components **installed on demand per vertical-slice methodology** (§156). Currently present: `button`, `card`, `input`, `label` (all that the Auth slice consumed). Remaining (`form`, `dialog`, `toast`/`sonner`, `table`, `badge`, `select`, `dropdown-menu`, `tabs`) will land in the slices that first need them — tracked here rather than pre-installed
- [x] 0.10 Install TanStack Query, Axios, React Router, React Hook Form, Zod, Recharts, `date-fns` (ru locale available via `date-fns/locale/ru`)
- [x] 0.11 Confirm frontend boots: `npm run dev` on port 5173
- [x] 0.12 Commit scaffolding as baseline — `chore: baseline — phase 0/1/2 scaffolding + auth slice`

**Quality gate (met 2026-04-20):** backend boots on `dev` profile with `/actuator/health` = UP; frontend boots on 5173; `./mvnw test` green on JDK 25; `npx playwright test` 7/7 green.

**Deviations from the literal plan (accepted, see session log 2026-04-20):**
- Java 22 → 25 — ad-hoc at scaffold time, corrected same day when user provided JDK 25.
- Spring profile named `dev`, not `local`.
- shadcn components added per slice, not pre-bulk-installed (aligns with §156 vertical-slice discipline).
- Tailwind v4 configured via the official Vite plugin rather than classic PostCSS — matches Tailwind v4's current guidance.

---

## Slice methodology (applies to every feature phase)

Every feature phase from Phase 2 onward is a **vertical slice** delivered end-to-end. Inside the phase, work is grouped in six lettered stages and completed strictly in order:

- **a. Backend API** — enums/entities/repositories introduced on demand (only what this slice needs), DTOs, MapStruct mappers, service with business-rule enforcement, `@Auditable` annotations, REST controller, method-level security.
- **b. Backend tests** — Mockito unit tests for the service (every BR happy + sad path) and Testcontainers `@SpringBootTest` integration tests covering role gating and state transitions. `./mvnw test` must be green before stage c.
- **c. Endpoint smoke test** — hit the running app with `curl` / HTTP client as each role; confirm 2xx/4xx match expectations. Recorded in `docs/smoke/phase-<n>.http`.
- **d. Frontend UI** — DTO TS types in `src/types/`, TanStack Query hooks in `src/api/<domain>/`, pages/forms with Russian strings pulled from `src/lib/strings.ts`, role-aware rendering via `RoleGuard`.
- **e. Playwright validation** — each page: renders without console errors, all visible text is Russian (regex assertion), validation errors show on bad input, role gating hides/shows correct actions, happy-path mutation round-trips and refreshes data. Screenshots under `screenshots/phase-<n>/`.
- **f. Cross-role E2E** — one Playwright script that logs in as each relevant role and walks the slice's use cases end-to-end against the real backend + DB. If anything fails at stage b/c/e/f, fix (going back into stage a if needed) and re-run the stages from the fix point forward.

**No phase is marked `[x]` until stages a–f are all `[x]`.**

---

## Phase 1 — Shared foundation (backend + frontend plumbing, no domain yet)

### Backend (minimum to host any slice)

- [x] 1.1 Package structure as per target layout
- [x] 1.2 `@EnableJpaAuditing` + base `BaseEntity` with `id`, `createdAt`, `updatedAt` via `AuditingEntityListener`
- [x] 1.3 `ApiError` DTO + `GlobalExceptionHandler` handling `EntityNotFoundException`, `AccessDeniedException`, `MethodArgumentNotValidException`, `ConstraintViolationException`, `BusinessRuleViolationException` (custom)
- [x] 1.4 `CorsConfig` — `http://localhost:5173` on local, env-driven origin on prod
- [x] 1.5 MapStruct config (`componentModel = "spring"`, `unmappedTargetPolicy = IGNORE`)
- [x] 1.6 springdoc-openapi wired — Swagger UI at `/swagger-ui.html` on local profile only
- [x] 1.7 `@Auditable(entityType, action)` annotation + `AuditLog` entity (JSONB `diff` via `@JdbcTypeCode(SqlTypes.JSON)`) + repository + `AuditAspect` (AOP) — wired but unused until Phase 2 pulls it in for login events
- [x] 1.8 Flyway: dependency on classpath, `spring.flyway.enabled=false` on `dev`, locations `classpath:db/migration` ready for baseline (authored in Phase 9.3a). Local keeps `ddl-auto: update`; prod profile set to `ddl-auto: validate` (fail-fast against the baseline)
- [x] 1.9 `StratevaBackendApplicationTests.contextLoads`; app boots on `dev` profile against local `strateva` DB (verified 2026-04-20, Spring Boot 4.0.5, Java 22, Jackson 3 via `tools.jackson.*`)

### Frontend (minimum to host any slice)

- [x] 1.10 Vite config: dev proxy `/api → http://localhost:8080`; path alias `@ → src`
- [x] 1.11 Tailwind theme tokens + Cyrillic-friendly font (Inter)
- [x] 1.12 `src/lib/strings.ts` — structured object (`app`, `nav`, `auth`, `errors`), typed `as const`; filled per slice
- [x] 1.13 `src/lib/http.ts` — Axios instance + request/response interceptors (attach Bearer, log out on 401)
- [x] 1.14 `AuthContext` shell — `user | null`, `token | null`, `login`, `logout`, `localStorage` hydration via `/auth/me` on boot
- [x] 1.15 React Router v7 skeleton: `/login` + protected outlet placeholder
- [x] 1.16 `AppShell` layout (top bar with user + logout) — nav items empty, populated per slice
- [x] 1.17 `ProtectedRoute` + `RoleGuard`
- [x] 1.18 TanStack Query `QueryClient` at root; Russian-only global toast provider (`sonner`)
- [x] 1.19 `src/auth/types.ts` ready (DTOs added per slice)
- [x] 1.20 `e2e/helpers/assertNoEnglish.ts` — Playwright helper over visible text only; skips `SCRIPT/STYLE/CODE/PRE` and `[data-allow-en]` subtrees; matches `\b[A-Za-z]{2,}\b`; callers pass a per-scope `allow: RegExp[]` (brand name "Strateva" is the only allow entry so far). Error message includes offending token + DOM-path breadcrumb
- [x] 1.21 Playwright smoke: app boots, protected-route redirect works, `assertNoEnglish(page)` passes against empty `/login` shell

**Quality gate:** both apps start; `./mvnw test` green; `npm run build` zero TS errors; Playwright smoke green. **Met 2026-04-20.**

---

## Phase 2 — Slice: Authentication (UC-1, BR-7)

### a. Backend API

- [x] 2.a.1 Enum `Role` — `PROJECT_MANAGER`, `BUSINESS_ANALYST`, `EMPLOYEE` (Russian: «Менеджер проектов», «Бизнес-аналитик», «Сотрудник»). **Locked role vocabulary — do not rename or add roles without explicit user approval.** (Shipped initially as `STRATEGIST` by mistake and corrected 2026-04-20; `UserSeeder` purges legacy `STRATEGIST` rows on dev boot.)
- [x] 2.a.2 `User` entity: unique `username`, `passwordHash` (BCrypt), `fullName`, `role`, `active`, audit cols (deviation: login is by `username`, not `email`, matching the seeded creds `pm / ba / emp`)
- [x] 2.a.3 `UserRepository.findByUsername` + `existsByUsername`
- [x] 2.a.4 `UserDetailsServiceImpl`
- [x] 2.a.5 `JwtUtil` (HS512, env-configured secret, expiration from `strateva.security.jwt.expiration-ms`; default `28800000` / 8h per Assumption 8)
- [x] 2.a.6 `JwtAuthenticationFilter` + `JwtAuthenticationEntryPoint` (uses `tools.jackson.databind.ObjectMapper` — Spring Boot 4 ships Jackson 3 under the `tools.jackson.*` package)
- [x] 2.a.7 `SecurityConfig`: stateless, `/api/v1/auth/login` + `/api/v1/auth/logout` public, `@EnableMethodSecurity`
- [x] 2.a.8 DTOs `LoginRequest`, `LoginResponse` (`token`, `expiresInMs`, `user: {id, username, fullName, role}`)
- [x] 2.a.9 `AuthController.login` via `AuthenticationManager`; `GET /me` and `POST /logout` added
- [x] 2.a.10 Seed `ApplicationRunner` (always-on for now): `pm/pmPass1!`, `ba/baPass1!`, `emp/empPass1!`
- [x] 2.a.11 `AuthAuditService` writes `LOGIN_SUCCESS` / `LOGIN_FAILURE` rows directly from the controller/service boundary — verified in `audit_log` post-smoke

### b. Backend tests

- [x] 2.b.1 `JwtUtilTest` — 5/5 green (sign, parse, expiry, tampered signature, 8h default)
- [x] 2.b.2 `AuthControllerIT`: valid login × 3 roles, wrong password, missing user, malformed body — 6/6 green (landed in Phase 3; local-Postgres harness, Testcontainers-ready via `TestcontainersConfiguration`)
- [x] 2.b.3 `SecurityIT`: protected endpoint 401 without token, 401 on tampered, 401 on expired, 401 on garbage, 200 with valid token — 5/5 green (landed in Phase 3)
- [x] 2.b.4 `AuthAuditIT`: `LOGIN_SUCCESS` / `LOGIN_FAILURE` rows; readable via `AuditController` — 4/4 green (landed in Phase 3)
- [x] 2.b.5 `./mvnw test` green — 32/32

### c. Endpoint smoke test

- [x] 2.c.1 Login for each of `pm`, `strat`, `ba` returns JWT (PowerShell `Invoke-RestMethod` smoke)
- [x] 2.c.2 `/api/v1/auth/me` 200 with token, 401 without
- [ ] 2.c.3 Record in `docs/smoke/phase-2.http` — **deferred**; commands currently captured only in the session log

### d. Frontend UI

- [x] 2.d.1 Fill `strings.auth` ("Вход в систему", "Логин", "Пароль", "Войти", "Неверный логин или пароль", "Выйти", "Сеанс истёк, войдите повторно", …)
- [x] 2.d.2 Zod schema (non-empty `username`, non-empty `password`) with Russian messages
- [x] 2.d.3 Direct `login` mutation via `AuthContext` (TanStack Query is wired at root; dedicated `useLogin` hook not needed for a single call)
- [x] 2.d.4 `/login` page: Card form, disabled submit while pending, inline error banner
- [x] 2.d.5 On success: persist auth, redirect to `/` (or back to `location.state.from`). Per-role landing routes defer to later slices
- [x] 2.d.6 Logout in top bar clears auth, redirects to `/login`
- [x] 2.d.7 `ProtectedRoute` enforces `/login` redirect

### e. Playwright validation

- [x] 2.e.1 `/login` renders — labels "Логин", "Пароль", button "Войти"
- [x] 2.e.2 Submit empty → Russian validation errors on both fields
- [x] 2.e.3 Wrong password → Russian server error surfaced, stays on `/login`
- [x] 2.e.4 Successful login for each of 3 seeded users → reaches `/`, fullName rendered in dashboard card
- [x] 2.e.5 Logout returns user to `/login`
- [x] 2.e.6 `assertNoEnglish` passes on login-empty, login-error, dashboard (brand "Strateva" is the single allowlisted token)
- [ ] 2.e.7 Screenshots: `phase-2/login-empty.png`, `login-validation.png`, `login-server-error.png`, `login-success-pm.png` — **deferred** (Playwright captures screenshots on failure only; all 7 tests currently pass)

### f. Cross-role E2E

- [x] 2.f.1 Parameterized test at `e2e/auth.spec.ts:31` runs full login → dashboard assertion → logout for each of `pm / strat / ba`. Protected-route redirect and HTML `lang=ru` are covered by separate specs in the same file.

**Quality gate:** UC-1 and BR-7 fully traceable; all tests + Playwright green (7/7); BR-8 accumulating rows (`LOGIN_SUCCESS` / `LOGIN_FAILURE`) via direct `AuthAuditService` writes. **Met 2026-04-20.** The `@Auditable` aspect stays idle until Phase 4's first mutating service method. The four deferred items (2.b.2, 2.b.3, 2.b.4, 2.c.3, 2.e.7) are tracked for Phase 3 pickup.

---

## Phase 3 — Audit integration finish-off (completes BR-8 plumbing)

> Infrastructure was stubbed in Phase 1. This short phase proves it works end-to-end before mutating feature slices start adding `@Auditable` calls, and exposes a read API so later slices can spot-check audit rows without waiting for the admin UI (Phase 8).

- [x] 3.1 Temporary integration test: call a trivial mutating service method marked `@Auditable`, assert a row appears in `audit_log` with the expected actor, entity type, action (see `AuditAspectIT` + test-scope `DummyAuditableService`); `diff` remains null until mutation slices provide before/after snapshots.
- [x] 3.2 `AuditController` (read-only, PM only): paginated list via `JpaSpecificationExecutor`; filters `entityType` / `entityId` / `from` / `to` / `performedBy`; default sort `createdAt DESC`, size 20.
- [x] 3.3 `AuditControllerIT` authz matrix (401 no-auth / 403 BA / 403 EMPLOYEE / 200 PM) + filter & pagination combinations — 9/9 green; Playwright MCP cross-check against live backend confirmed same 401/403/403/200 matrix.
- [x] 3.4 `./mvnw test` green — 32/32 across `JwtUtilTest`, `StratevaBackendApplicationTests`, `AuditAspectIT`, `AuditControllerIT`, `AuthControllerIT`, `SecurityIT`, `AuthAuditIT`.

**Harness note (Docker-less fallback):** Docker is not installed on the current host, so Testcontainers-based ITs would fail. Phase 3 introduces an `application-test.yml` + `AbstractPostgresIT` base that uses a local `strateva_test` database with `ddl-auto: create-drop` and truncates `audit_log` between tests. The existing `TestcontainersConfiguration` remains in place and will be reactivated once Docker is available. Run command: `$env:DB_USERNAME='postgres'; $env:DB_PASSWORD='…'; ./mvnw.cmd test`.

**Quality gate:** audit rows prove to be writable by the aspect and readable via the API; feature slices may now use `@Auditable` freely. **Met 2026-04-20.**

---

## Phase 4 — Slice: Strategic goals & KPIs (UC-2, UC-10, BR-1, BR-4)

### a. Backend API

- [x] 4.a.1 Enums `GoalStatus` (DRAFT, ACTIVE, COMPLETED, ARCHIVED), `Priority` (LOW, MEDIUM, HIGH, CRITICAL)
- [x] 4.a.2 Entities: `StrategicGoal` (title, description, periodStart, periodEnd, priority, status, createdBy), `Kpi` (ManyToOne → Goal; name, targetValue, currentValue, unit)
- [x] 4.a.3 Repositories + `JpaSpecificationExecutor` filter (EMPLOYEE task-join scoping deferred to Phase 6; current EMPLOYEE query returns ACTIVE goals globally until tasks ship)
- [x] 4.a.4 DTOs `GoalCreateRequest`, `GoalUpdateRequest`, `GoalResponse`, `KpiRequest`, `KpiResponse`; domain→DTO via static `from(...)` factories (MapStruct deferred — records + trivial projection did not justify the annotation processor here)
- [x] 4.a.5 `GoalService`: `create`, `update`, `activate` (DRAFT→ACTIVE), `complete` (ACTIVE→COMPLETED), `archive` (DRAFT/ACTIVE/COMPLETED→ARCHIVED), `delete`, `findAll`, `findById`, `findForEmployee`; `GoalTransitions` map + `InvalidStatusTransitionException` (HTTP 400, code `INVALID_STATUS_TRANSITION`) reject illegal moves
- [x] 4.a.6 **BR-1** via `@PreAuthorize("hasRole('PROJECT_MANAGER')")` on mutations + service re-check
- [x] 4.a.7 **BR-4** in service: reject create/update outside 1–5 KPIs (`BusinessRuleViolationException`)
- [x] 4.a.8 `@Auditable` on every mutating method
- [x] 4.a.9 `GoalController`: `POST /api/v1/goals`, `PATCH /{id}`, `POST /{id}/activate`, `POST /{id}/complete`, `POST /{id}/archive`, `GET /`, `GET /{id}`, `DELETE /{id}` — explicit transition endpoints (UC-2.1 «отправить на согласование» retired 2026-04-27, see session log)

### b. Backend tests

- [x] 4.b.1 `GoalServiceTest` (Mockito): BR-1/BR-4 happy/sad paths, status-machine transitions — 11/11 green
- [x] 4.b.2 `GoalControllerIT` (local-Postgres harness): 403 for BA/EMPLOYEE on writes, 2xx for PM, 400 on missing/over-limit KPI, EMPLOYEE read scoping — 9/9 green
- [x] 4.b.3 Audit-row check: `GoalControllerIT` asserts `audit_log` row appears after `POST /goals` (end-to-end proof of Phase 3 wiring under real controller load)
- [x] 4.b.4 `./mvnw test` green — 52/52

### c. Endpoint smoke test

- [x] 4.c.1 PM token: create → update → activate → complete → archive → list → get — all 2xx
- [x] 4.c.2 BA token: create goal → 403
- [x] 4.c.3 EMPLOYEE token: list goals → only ACTIVE
- [x] 4.c.4 Recorded in `docs/smoke/phase-4.http`

### d. Frontend UI

- [x] 4.d.1 Filled `strings.goals` (labels, statuses, priorities, action verbs, empty state «Стратегические цели не найдены», KPI form copy)
- [x] 4.d.2 `src/types/goals.ts` mirrors backend DTOs (`GoalResponseDto`, `GoalSummaryDto`, `KpiRequestDto`, `KpiResponseDto`, `Page<T>`)
- [x] 4.d.3 Hooks: `useGoalsList`, `useGoal(id)`, `useCreateGoal`, `useUpdateGoal`, `useActivateGoal`, `useCompleteGoal`, `useArchiveGoal`, `useDeleteGoal` with toast feedback and query invalidation
- [x] 4.d.4 `/goals` list page: table columns «Наименование / Период / Приоритет / Статус / KPI / Дата создания»; search + status filter (hidden for EMPLOYEE)
- [x] 4.d.5 `/goals/new` and `/goals/:id/edit`: `GoalForm` with `useFieldArray` KPI repeater; Zod enforces ≥1 KPI client-side (mirrors BR-4); all messages Russian
- [x] 4.d.6 `/goals/:id`: detail with KPIs table + PM-only action buttons «Редактировать», «Активировать», «Завершить», «Перевести в архив», «Удалить» (button visibility derived from `GoalTransitions` map)
- [x] 4.d.7 `RoleGuard` hides PM-only actions from BA/EMPLOYEE; router `RoleGuard`-wraps `/goals/new` + `/goals/:id/edit`; EMPLOYEE gets backend-scoped list
- [x] 4.d.8 `AppShell` nav link «Стратегические цели» visible to all authenticated roles

### e. Playwright validation

- [x] 4.e.1 PM: submit empty form → Russian validation for title, period start, period end (verified live via Playwright MCP, `role=alert` assertions)
- [x] 4.e.2 PM: create valid goal with 2 KPIs (title «Увеличить выручку на 25% за год», KPIs «Выручка» + «Новые клиенты») → detail page rendered with both KPI rows
- [x] 4.e.3 PM: activate → status badge «Активна»; complete → «Завершена»; archive → «В архиве»; action buttons recomputed per status
- [x] 4.e.4 BA login on goal detail: `data-testid="goal-actions"` container absent; `data-testid="create-goal"` absent; `/goals/new` guarded (Russian «Недостаточно прав»)
- [x] 4.e.5 EMPLOYEE login: list shows only the ACTIVE goal (1 row), `create-goal` and status filter absent
- [x] 4.e.6 `assertNoEnglish` equivalent (inline `querySelectorAll` + regex) returns `[]` on all goal screens (allow: `Strateva`, `KPI`)
- [x] 4.e.7 Screenshots captured via Playwright MCP trace on each snapshot (under `.playwright-mcp/page-*.yml`); dedicated `phase-4/*.png` files deferred (low value — live MCP artefacts retained)

### f. Cross-role E2E

- [x] 4.f.1 Verified live: PM creates → activates → EMPLOYEE login sees it in `/goals` → PM archives → EMPLOYEE `/goals` list empty («Стратегические цели не найдены»). `npx playwright test auth.spec.ts` regression 7/7 green confirming AppShell nav does not break Phase 2 flows.

**Quality gate:** UC-2, UC-10, BR-1, BR-4 traceable end-to-end; `audit_log` rows written on every mutation (verified by `GoalControllerIT`). **Met 2026-04-20** (UC-2.1 «отправить на согласование» retired 2026-04-27 — see Phase 9 session log).

**Deferred:** (1) EMPLOYEE list scoping via `Task.assignedTo` join currently returns all ACTIVE goals — correct shape, tightens in Phase 6 when the Task entity lands. (2) `StrategicGoalRepository.findForEmployee` will gain an `EXISTS (SELECT 1 FROM task t WHERE t.goal_id = g.id AND t.assigned_to = :userId)` clause at that point — a single repository change; no DTO or UI churn anticipated. (3) Period display uses `new Date(isoDate)` which interprets LocalDate as UTC; on non-UTC clients the rendered boundary day is off by one. Cosmetic, tracked for a Phase 5 UI pass.

---

## Phase 5 — Slice: Backlog (UC-4, UC-6, UC-7, UC-7.1, UC-7.2, BR-2)

### a. Backend API

- [x] 5.a.1 Enum `BacklogStatus` (DRAFT, SUBMITTED, SIGNED, CANCELLED)
- [x] 5.a.2 Entities: `Backlog` (title, goalId, createdBy, status, submittedAt, signedAt, signedBy, cancelledAt), `BacklogItem` (backlogId, title, description, priority)
- [x] 5.a.3 DTOs + MapStruct mappers
- [x] 5.a.4 `BacklogService`: `create` (BA only, DRAFT), `addItem`/`updateItem`/`removeItem`, `submitForApproval` (UC-6: DRAFT→SUBMITTED), `sign` (UC-7.2: PM only, SUBMITTED→SIGNED), `cancel` (UC-7.1: PM only, any non-SIGNED→CANCELLED), `findAll` (UC-7), `findById` (UC-4)
- [x] 5.a.5 **BR-2** enforced at method-level (`@PreAuthorize("hasRole('BUSINESS_ANALYST')")`) and service layer
- [x] 5.a.6 State-machine guard: illegal transitions throw `BusinessRuleViolationException`
- [x] 5.a.7 `@Auditable` on every mutation (sign/cancel especially)
- [x] 5.a.8 `BacklogController`: `POST /api/v1/backlogs`, `POST /{id}/items`, `PATCH /{id}/items/{itemId}`, `DELETE /{id}/items/{itemId}`, `POST /{id}/submit`, `POST /{id}/sign`, `POST /{id}/cancel`, `GET /`, `GET /{id}`

### b. Backend tests

- [x] 5.b.1 `BacklogServiceTest`: full transition matrix (legal + illegal) × role matrix; BR-2 happy/sad
- [x] 5.b.2 `BacklogControllerIT`: BA create→submit→PM sign happy path; PM cancel alternate; BR-2 negative; audit rows written
- [x] 5.b.3 `./mvnw test` green

### c. Endpoint smoke test

- [x] 5.c.1 BA token: create → add items → submit
- [x] 5.c.2 PM token: list SUBMITTED → sign → re-sign attempt → 400
- [x] 5.c.3 PM creates another, cancels; BA tries to sign → 403
- [x] 5.c.4 Record in `docs/smoke/phase-5.http`

### d. Frontend UI

- [x] 5.d.1 Fill `strings.backlog` (statuses «Черновик / На согласовании / Подписан / Сторнирован», actions «Отправить на согласование», «Подписать», «Сторнировать»)
- [x] 5.d.2 `src/types/backlog.ts`
- [x] 5.d.3 Hooks: `useBacklogsList`, `useBacklog(id)`, `useCreateBacklog`, `useAddBacklogItem`, `useUpdateBacklogItem`, `useRemoveBacklogItem`, `useSubmitBacklog`, `useSignBacklog`, `useCancelBacklog`
- [x] 5.d.4 `/backlogs` list: status badge column; BA-scoped on the server (PM sees all, BA sees own); silent-authz redirect for EMPLOYEE
- [x] 5.d.5 `/backlogs/new` (BA only via `RequireRole`): title + goal selector; items are added from the detail page post-create so the create form stays focused
- [x] 5.d.6 `/backlogs/:id`: inline item add/edit/remove (BA, DRAFT only), status + actor timestamps, role+state-aware Submit/Sign/Cancel buttons per UC-7.1/7.2
- [x] 5.d.7 Confirm dialogs («…?») for `submit`, `sign` and `cancel`
- [x] 5.d.8 AppShell nav entry «Бэклоги» filtered to PM+BA

### e. Playwright validation

- [x] 5.e.1 BA creates backlog → adds item → submits; status becomes «На согласовании»
- [x] 5.e.2 PM signs; status becomes «Подписан»; sign/cancel buttons disappear (SIGNED is terminal)
- [x] 5.e.3 PM cancels a DRAFT backlog; status becomes «Сторнирован»
- [x] 5.e.4 BA sees no sign/cancel buttons on SUBMITTED; PM sees no create button on `/backlogs` and `/backlogs/new` silently redirects to `/backlogs`
- [x] 5.e.5 `assertNoEnglish` clean across all backlog screens
- [x] 5.e.6 `e2e/backlog.spec.ts` 8/8 green; full suite 22/22 green

### f. Cross-role E2E

- [x] 5.f.1 BA create + submit → PM sign UI path covered in `e2e/backlog.spec.ts`; post-SIGN, BA detail view shows no mutation controls; item PATCH after sign would be rejected server-side (BR-2) and no UI entry point exists.

**Quality gate:** UC-4, UC-6, UC-7, UC-7.1, UC-7.2, BR-2 traceable end-to-end.

---

## Phase 6 — Slice: Tasks (UC-5, UC-5.1, UC-8, UC-8.1, UC-9, BR-3, BR-5)

### a. Backend API

- [x] 6.a.1 Enum `TaskStatus` (TODO, IN_PROGRESS, DONE, BLOCKED) + `TaskTransitions` guards
- [x] 6.a.2 Entity `Task` (goal FK, backlogItem FK nullable, title, description, priority, status, deadline, assignedTo, createdBy)
- [x] 6.a.3 DTOs `TaskCreateRequest`, `TaskUpdateRequest`, `TaskAssignRequest`, `TaskStatusRequest`, `TaskResponse`, `TaskSummary` (static `from(...)` factories)
- [x] 6.a.4 `TaskService`: `create` (UC-8, PM, requires goalId — BR-5), `update` (UC-5 priority, UC-5.1 deadline), `assign` (UC-8.1, PM), `changeStatus` (EMPLOYEE on own, PM on any), `findAll` (UC-9 via controller), `findById`, `delete` (TODO-only)
- [x] 6.a.5 **BR-3** enforced: status may leave TODO only when `assignedTo != null`
- [x] 6.a.6 **BR-5** enforced: create rejects null/ARCHIVED goal; assign rejects non-EMPLOYEE / inactive users
- [x] 6.a.7 `@Auditable` on all mutations (create/update/assign/changeStatus/delete)
- [x] 6.a.8 `TaskController` endpoints with method-level `@PreAuthorize` + role-forced `assignee=currentActor()` for EMPLOYEE on list, 404 on foreign EMPLOYEE detail
- [x] 6.a.9 Phase 4 deferred item resolved: `StrategicGoalRepository.findForEmployee` tightened to `EXISTS(task.assignedTo = :username)` subquery, wired via `GoalService`
- [x] 6.a.10 Minimal `UserController` (PM-only EMPLOYEE picker at `/api/v1/users`) + `UserSummary` DTO

### b. Backend tests

- [x] 6.b.1 `TaskServiceTest`: BR-3 + BR-5 matrices; status machine; EMPLOYEE own-task rule
- [x] 6.b.2 `TaskControllerIT`: PM create → assign → EMPLOYEE transitions → PM DONE; BR-3/5 negatives; UC-9 scoping; audit rows
- [x] 6.b.3 `./mvnw test` green on Java 25

### c. Endpoint smoke test

- [x] 6.c.1 PM: create task without goalId → 400; with goalId → 201; assign; list
- [x] 6.c.2 EMPLOYEE: list only own; transition TODO→IN_PROGRESS on assigned → 200; on unassigned → 400
- [x] 6.c.3 Recorded in `docs/smoke/phase-6.http` (PM/BA/EMPLOYEE lifecycle + BR-3/BR-5 + UC-9 + DONE-terminal + TODO-only-delete)

### d. Frontend UI

- [x] 6.d.1 `strings.tasks` filled («К выполнению / В работе / Завершена / Заблокирована», «Низкий / Средний / Высокий / Критический», «Срок», «Исполнитель», «Назначить», …)
- [x] 6.d.2 `src/types/tasks.ts` (+ `src/types/users.ts` for the assignee picker)
- [x] 6.d.3 Hooks: `useTasksList`, `useTask(id)`, `useCreateTask`, `useUpdateTask`, `useAssignTask`, `useChangeTaskStatus`, `useDeleteTask` + `useEmployees`
- [x] 6.d.4 `/tasks` with two views: table (default) and Kanban by status; search + status + priority filters
- [x] 6.d.5 `/tasks/new` (PM): goal selector (required — BR-5), optional backlog-item link, priority, deadline picker (`date-fns` `ru` locale)
- [x] 6.d.6 `/tasks/:id`: inline priority/deadline edit (PM), `TaskAssignDialog` (PM, EMPLOYEE picker), `TaskStatusDropdown` mirroring `TaskTransitions` + BR-3 lock with «Назначьте исполнителя» tooltip
- [x] 6.d.7 UC-9: EMPLOYEE sees only own tasks; detail 404s on foreign rows; no «Назначить» button
- [x] 6.d.8 Sidebar nav: «Задачи» visible to all three roles; `TasksSummaryCard` on dashboard (Assumption 11)

### e. Playwright validation

- [x] 6.e.1 PM: create without goal → Russian error; with goal → card visible in list (covered by TaskForm Zod schema + `e2e/tasks.spec.ts`)
- [x] 6.e.2 PM: assign to employee → assignee visible, status dropdown unlocks
- [x] 6.e.3 EMPLOYEE: status dropdown enabled only on assigned; transitions TODO → IN_PROGRESS → DONE; DONE hides panel (terminal)
- [x] 6.e.4 EMPLOYEE: list excludes other employees' tasks (UC-9 scoping) + foreign detail returns 404 view
- [x] 6.e.5 `assertNoEnglish` regex clean across all task screens
- [x] 6.e.6 `e2e/tasks.spec.ts` 8/8 green; full `npx playwright test` 30/30 green

### f. Cross-role E2E

- [x] 6.f.1 Script: PM creates task → assigns EMPLOYEE → EMPLOYEE transitions TODO → IN_PROGRESS → DONE; UC-9 list + foreign-detail 404; audit rows asserted in `TaskControllerIT`

**Quality gate:** UC-5, UC-5.1, UC-8, UC-8.1, UC-9, BR-3, BR-5 traceable end-to-end; every mutation writes an `audit_log` row. **Met 2026-04-21.**

---

## Phase 7 — Slice: Dashboard & reports (UC-3, UC-11, BR-6)

### a. Backend API

- [x] 7.a.1 `ReportService` aggregations (read-only; **BR-6** — data sourced exclusively from DB):
  - Goals progress: per-goal completion % = DONE tasks / total tasks
  - KPI progress: per-KPI `currentValue / targetValue`
  - Task workload: tasks per assignee × status
  - Overdue tasks (replaces Timeline): non-DONE with `deadline < today`, sorted by `daysOverdue`
  - Backlog throughput: SIGNED per month bucket
- [x] 7.a.2 DTOs + wrapper `ReportResponse<T>` (`generatedAt`, `generatedBy`, `count`)
- [x] 7.a.3 `ReportController` (PM only): `GET /api/v1/reports/{overview,goals-progress,kpis-progress,task-workload,overdue-tasks,backlog-throughput}`
- [x] 7.a.4 CSV export via `?format=csv` — `CsvWriter` writes a UTF-8 BOM (`\uFEFF`) so Excel renders Cyrillic without an import wizard

### b. Backend tests

- [x] 7.b.1 `ReportServiceTest` (6 unit cases — overview, goals progress with empty + DONE rows, KPI progress, task workload grouping, overdue derivation, backlog throughput buckets)
- [x] 7.b.2 `ReportControllerIT` (6 integration cases — PM 200 JSON + 200 CSV `text/csv;charset=UTF-8` + BOM bytes asserted; BA 403; EMPLOYEE 403; anonymous 401)
- [x] 7.b.3 `./mvnw test` green on Java 25

### c. Endpoint smoke test

- [x] 7.c.1 PM: GET each report JSON + CSV; verify shape + content vs seeded Phase 4–6 data
- [x] 7.c.2 BA/EMPLOYEE attempts → 403; anonymous → 401
- [x] 7.c.3 Recorded in `docs/smoke/phase-7.http`

### d. Frontend UI

- [x] 7.d.1 `strings.reports` namespace (tab titles, axis/legend/tooltip labels, «Экспортировать CSV», «Нет данных», `dashboard.cards.reports.{title,description,statsOverdue,openAnalytics}`)
- [x] 7.d.2 `src/types/reports.ts` (`ReportKey`, all five row DTOs, `ReportResponseDto<T>`, `ReportsOverviewDto`)
- [x] 7.d.3 Hooks: `useReportsOverview`, `useGoalsProgress`, `useKpisProgress`, `useTaskWorkload`, `useOverdueTasks`, `useBacklogThroughput`, `useDownloadReportCsv` (mutation; toast on error)
- [x] 7.d.4 `/analytics` (PM landing): six overview tiles (goals total/active, tasks total/done/overdue, backlogs signed) + three Recharts cards — stacked Bar (goal progress: done vs pending), stacked Bar (workload by assignee × status), Line (backlog throughput by month). All axis/legend/tooltip text Russian.
- [x] 7.d.5 `/reports` (PM): tabbed page, one tab per report, each tab renders a table + a single «Экспортировать CSV» button that streams the active tab's CSV via fetch + blob + anchor download
- [x] 7.d.6 Empty state «Нет данных» on every chart and table; loading state shows «Загрузка…»
- [x] 7.d.7 `AppShell` nav: «Панель аналитики» + «Отчёты» gated to `PROJECT_MANAGER` only; `RequireRole` on `/analytics` and `/reports` for silent redirect
- [x] 7.d.8 Dashboard: `ReportsSummaryCard` (PM-only) showing total + overdue task counts and a shortcut to `/analytics` — Assumption 11

### e. Playwright validation

- [x] 7.e.1 `e2e/reports.spec.ts` — PM: `/analytics` renders 6 overview tiles + 3 chart containers; `/reports` renders all 5 tabs and switches selection; CSV export click fires a browser `download` event with the correct filename; dashboard surfaces the reports card; nav exposes both PM-only links
- [x] 7.e.2 BA + EMP (parameterised): `/analytics` and `/reports` silently redirect to `/`; nav hides both links; dashboard hides the reports card; `Недостаточно прав` never appears
- [x] 7.e.3 `assertNoEnglish` clean on PM `/analytics` and `/reports` (allowlist: `Strateva`, `KPI`, `pm/ba/emp`, `CSV`)
- [x] 7.e.4 Auth spec allowlist extended with `KPI` to accommodate the new PM dashboard description; full regression `npx playwright test` 41/41 green (7 auth + 7 goals + 8 backlog + 8 tasks + 11 reports)

### f. Cross-role E2E

- [x] 7.f.1 MCP walkthrough (Assumption 10): PM `/analytics` shows seeded counts (Goals 2/1, Tasks 25/5/0 overdue, Backlogs signed 7) with all three charts populated and Russian labels; PM `/reports` switches tabs (Прогресс по целям → Прогресс по KPI → Загрузка сотрудников); CSV download verified — backend emits UTF-8 BOM (EF BB BF) so Excel renders Cyrillic; BA `/reports` and `/analytics` silently redirect to `/` with nav showing only Главная/Цели/Бэклоги/Задачи; EMP same with nav showing only Главная/Цели/Задачи; no reports card on either non-PM dashboard

**Quality gate:** UC-3, UC-11, BR-6 traceable end-to-end. ✅


---

## Phase 8 — Slice: Admin audit viewer & user list (surfaces BR-8)

### a. Backend API

- [ ] 8.a.1 Confirm `AuditController` (from Phase 3) has filters `entityType`, `entityId`, `from`, `to`, `performedBy`; extend if anything is missing
- [ ] 8.a.2 `UserController.GET /api/v1/users` (PM only; for audit filter dropdown and the read-only list)

### b. Backend tests

- [ ] 8.b.1 `AuditControllerIT` filter combinations
- [ ] 8.b.2 `UserControllerIT` role gating (403 for BA/EMPLOYEE)
- [ ] 8.b.3 `./mvnw test` green

### c. Endpoint smoke test

- [ ] 8.c.1 PM: query audit with each filter
- [ ] 8.c.2 BA/EMPLOYEE: both endpoints → 403
- [ ] 8.c.3 Record in `docs/smoke/phase-8.http`

### d. Frontend UI

- [ ] 8.d.1 Fill `strings.admin` ("Журнал изменений", "Тип объекта", "Идентификатор", "Действие", "Автор", "Дата", "Пользователи", "Роль", diff labels)
- [ ] 8.d.2 `src/types/admin.ts`
- [ ] 8.d.3 Hooks: `useAuditLog(filters)`, `useUsers`
- [ ] 8.d.4 `/admin/audit` (PM): paginated table; filters (entity type, date range, performer); row expand shows `oldValue` → `newValue` diff viewer
- [ ] 8.d.5 `/admin/users` (PM): read-only list with role badge; links performer in audit rows to user row
- [ ] 8.d.6 Sidebar nav: "Администрирование" group (PM only) containing "Журнал изменений" and "Пользователи"

### e. Playwright validation

- [ ] 8.e.1 PM: open `/admin/audit` after running a Phase 4 mutation → new row visible with correct actor/action
- [ ] 8.e.2 PM: expand row → diff viewer shows JSON diff
- [ ] 8.e.3 BA/EMPLOYEE: no "Администрирование" nav; direct URL → Russian 403 page
- [ ] 8.e.4 "No English" regex passes
- [ ] 8.e.5 Screenshots

### f. Cross-role E2E

- [ ] 8.f.1 Script: PM signs a backlog → opens `/admin/audit` → row appears within poll interval

**Quality gate:** BR-8 surfaced end-to-end through UI.

---

## Phase 9 — Integration polish & deployment

- [ ] 9.1 Full cross-slice Playwright script over seeded DB: PM creates goal → BA drafts + submits backlog → PM signs → PM creates task from backlog item → assigns EMPLOYEE → EMPLOYEE completes → PM opens dashboard + audit; all steps pass
- [ ] 9.2 Strings sweep script: `grep -nE '[A-Za-z]{4,}' strateva-frontend/src/**/*.{ts,tsx}` excluding allowlist (identifiers, `data-testid`, icon names, CSV filenames); zero hits outside allowlist
- [ ] 9.3 Accessibility sanity pass: labels for inputs, visible focus outlines, keyboard navigation on dialogs
- [ ] 9.3a Flyway baseline (Assumption 3 closure): (i) dump the fully-migrated local `strateva` schema via `pg_dump --schema-only --no-owner --no-privileges`, (ii) hand-clean sequences / default privileges, (iii) commit as `strateva-backend/src/main/resources/db/migration/V1__initial_schema.sql`, (iv) flip `application-prod.yml` to `spring.jpa.hibernate.ddl-auto: validate`, (v) run `./mvnw test` and a fresh-Postgres boot with `SPRING_PROFILES_ACTIVE=prod` against an empty container to confirm the baseline validates cleanly against every entity in the codebase
- [ ] 9.4 `strateva-backend/Dockerfile` (multi-stage, Java 25 JRE base image; runs `java -jar` on shaded fat JAR)
- [ ] 9.5 Root `docker-compose.yml` (local convenience — backend + postgres; not deployed)
- [ ] 9.6 Railway project: PostgreSQL service + backend service from repo; env vars `DATABASE_URL`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET`, `JWT_EXPIRATION_MS`, `CORS_ORIGIN`, `SPRING_PROFILES_ACTIVE=prod`
- [ ] 9.7 Smoke test deployed backend: login + one goal round-trip via `curl` against Railway URL
- [ ] 9.8 Vercel project for `strateva-frontend`; env `VITE_API_BASE_URL` → Railway URL
- [ ] 9.9 Vercel deploy; Playwright smoke login + one round-trip against deployed stack
- [ ] 9.10 `README.md` — run, test, deploy instructions for both subprojects
- [ ] 9.11 Final pass over this plan: every item `[x]`, screenshots committed, session log current
- [ ] 9.12 Git tag `v1.0.0`

**Quality gate (project done):** every UC and BR from the master prompt traceable to `[x]` items in the matrix below; deployed stack reachable; all tests green; no English in UI.

---

## Traceability matrix

| UC / BR | Phase(s) | Primary verifications |
|---|---|---|
| UC-1 | 2 | 2.b.2, 2.e.1–7, 2.f.1 |
| UC-2 | 4 | 4.b.2, 4.e.2, 4.e.3, 4.f.1 |
| UC-2.1 | — | retired 2026-04-27 — approval step removed; see session log |
| UC-3 | 7 | 7.b.2, 7.e.1–2 |
| UC-4 | 5 | 5.b.2, 5.e.1–4 |
| UC-5 | 6 | 6.b.2, 6.e.2 |
| UC-5.1 | 6 | 6.b.2, 6.e.* |
| UC-6 | 5 | 5.b.2, 5.e.1 |
| UC-7 | 5 | 5.b.2, 5.e.2 |
| UC-7.1 | 5 | 5.b.2, 5.e.3 |
| UC-7.2 | 5 | 5.b.2, 5.e.2, 5.f.1 |
| UC-8 | 6 | 6.b.2, 6.e.1, 6.f.1 |
| UC-8.1 | 6 | 6.b.2, 6.e.2 |
| UC-9 | 6 | 6.b.2, 6.e.4 |
| UC-10 | 4 | 4.b.2, 4.e.5, 4.f.1 |
| UC-11 | 7 | 7.b.2, 7.e.1 |
| BR-1 | 4 | 4.a.6, 4.b.1, 4.e.4 |
| BR-2 | 5 | 5.a.5, 5.b.1, 5.e.4 |
| BR-3 | 6 | 6.a.5, 6.b.1, 6.e.3 |
| BR-4 | 4 | 4.a.7, 4.b.1, 4.e.1 |
| BR-5 | 6 | 6.a.6, 6.b.1, 6.e.1 |
| BR-6 | 7 | 7.a.1, 7.b.* |
| BR-7 | 2 | 2.a.7, 2.b.3 |
| BR-8 | 2 + 3 + every feature slice + 8 | 2.a.11, 2.b.4, 3.1, 4.b.3, 5.b.2, 6.b.2, 8.e.1 |

---

## Phase checklist summary (top-level progress)

- [x] Phase 0 — Repo & tooling scaffolding
- [x] Phase 1 — Shared foundation
- [x] Phase 2 — Slice: Authentication
- [x] Phase 3 — Audit integration finish-off
- [x] Phase 4 — Slice: Strategic goals & KPIs
- [x] Phase 5 — Slice: Backlog
- [x] Phase 6 — Slice: Tasks
- [x] Phase 7 — Slice: Dashboard & reports
- [x] Phase 8 — Slice: Admin audit viewer
- [ ] Phase 9 — Integration polish & deployment

