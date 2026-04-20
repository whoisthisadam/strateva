# Strateva

**Strateva** — Strategic IT & Business Planning Tool (diploma project, БГУИР).

A role-based planning application for aligning strategic goals, KPIs, backlogs, tasks, and reporting across `PROJECT_MANAGER`, `BUSINESS_ANALYST`, and `EMPLOYEE` roles. UI is Russian-only.

## Repo layout

```
strateva/
├── implementation-plan.md   ← source of truth, updated every working session
├── strateva-backend/        ← Spring Boot 4 + Java 25 + PostgreSQL 17
└── strateva-frontend/       ← React 19 + Vite 6 + Tailwind 4 + TanStack Query
```

## Prerequisites

- **JDK 25** (LTS); `JAVA_HOME` must point at it.
- **Node.js 20+** with `npm`.
- **PostgreSQL 17** listening on `localhost:5432`; a database named `strateva` must exist.
- **Maven**: use the bundled wrapper (`./mvnw` / `./mvnw.cmd`) — no system install required.

## Environment variables

Both apps read config from env; defaults target local development.

| Variable | Default | Purpose |
|---|---|---|
| `DB_URL` | `jdbc:postgresql://localhost:5432/strateva` | JDBC URL |
| `DB_USERNAME` | `postgres` | DB user |
| `DB_PASSWORD` | `postgres` | DB password |
| `JWT_SECRET` | dev-only placeholder | HS512 signing key (override in prod) |
| `JWT_EXPIRATION_MS` | `28800000` (8 h) | Access-token TTL |
| `SERVER_PORT` | `8080` | Backend HTTP port |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173` | Frontend origin(s) |
| `SPRING_PROFILES_ACTIVE` | `dev` | Spring profile (`dev` / `prod`) |

## Running locally

### Backend

```powershell
cd strateva-backend
$env:DB_USERNAME = 'postgres'
$env:DB_PASSWORD = '<your-postgres-password>'
./mvnw.cmd spring-boot:run
```

Health: `GET http://localhost:8080/actuator/health` → `{"status":"UP"}`.
OpenAPI: `http://localhost:8080/swagger-ui.html`.

### Frontend

```powershell
cd strateva-frontend
npm install
npm run dev
```

App: `http://localhost:5173`.

### Seeded users (dev profile only)

| Role | Login | Password |
|---|---|---|
| `PROJECT_MANAGER` | `pm` | `pmPass1!` |
| `BUSINESS_ANALYST` | `ba` | `baPass1!` |
| `EMPLOYEE` | `emp` | `empPass1!` |

## Tests

```powershell
# Backend unit + integration
cd strateva-backend && ./mvnw.cmd test

# Frontend E2E (auto-starts Vite)
cd strateva-frontend && npx playwright test
```

## Further reading

- `implementation-plan.md` — phased plan, quality gates, traceability matrix, session log.
