<!--
# Sync Impact Report
- Version change: 1.0.0 → 1.1.0
- List of modified principles:
  - II. Single Source of Truth API Contracts (Contract-Driven): Added mandatory explicit `response_model` requirement on all FastAPI routes, ban on manual duplicate Zod schemas in favor of direct `Schema<"Model">` consumption from `@/types/api`, ban on defensive union types (e.g. `z.union([z.boolean(), z.string(), z.number()])`), and canonical `id` entity identification banishing dual `id`/`question_id` aliasing.
  - V. Authority & State Separation: Added explicit timing authority and grace periods policy (10s patch cutoff, 60s submit grace), along with in-memory calculation principle for derived metrics (`correct_count`, `total_questions`) to avoid unnecessary DB schema migrations.
- Added sections: None
- Removed sections: None
- Follow-up TODOs: None
-->

# DUT-AI Quiz Constitution

## Core Principles

### I. Lightweight Domain-Driven Design (Lightweight DDD)
The backend (`apps/api`) MUST strictly separate concerns across architectural layers:
- `presentation/`: FastAPI routers, Pydantic schemas, and dependency injection (`dishka`). Every route MUST declare explicit `response_model` types. No direct database queries or raw SQL.
- `application/use_cases/`: Granular use case interactors (`execute(...)`) coordinating application flow.
- `application/services/`: Pure business logic (e.g. scoring, question shuffling, item application).
- `infrastructure/`: Persistence (SQLModel, repositories), external auth integration, and third-party APIs.
- *Rationale*: Keeps domain business rules decoupled from database implementations and HTTP transport, enabling fast unit testing and safe refactoring.

### II. Single Source of Truth API Contracts (Contract-Driven)
All client-server interactions MUST adhere to strict, typed schemas:
- Every FastAPI endpoint MUST define explicit Pydantic `response_model` and input body types. Raw untyped dictionaries or loose JSON payloads are strictly prohibited.
- The frontend (`apps/web`) MUST generate and synchronize types directly from FastAPI's OpenAPI specification using `openapi-typescript` (`make generate-api` / `npm run generate:api`).
- Schema definitions in `apps/web/types/api.generated.d.ts` serve as the canonical contract. Frontend features MUST consume them via the centralized `Schema<"ModelName">` utility (as established in `features/game/types.ts` and `features/attempts/types.ts`).
- **Ban on Duplicate Zod Boilerplate**: Frontend internal API queries MUST NOT re-declare redundant manual Zod schemas for responses; React Query hooks consume `apiGet<T>` and `apiPost<T>` with OpenAPI `Schema<"ModelName">` types. Runtime Zod validation is reserved strictly for untrusted user form inputs and external webhook boundaries.
- **Ban on Defensive Type Dilution**: Strict data types MUST be preserved across the contract boundary. Boolean fields MUST remain strictly `boolean | null`; defensive unions such as `z.union([z.boolean(), z.string(), z.number()])` are strictly forbidden.
- **Canonical Entity Identifiers**: An entity's primary identifier MUST be named `id` consistently across all models and endpoints. Dual aliasing (`id` and `question_id` on the same object) is prohibited.
- *Rationale*: Eliminates drift between backend reality and frontend expectations, prevents runtime crashes, guarantees true type safety, and eliminates redundant maintenance overhead.

### III. Feature-First Frontend Architecture
The frontend codebase MUST be organized by business domain features:
- Code resides in `apps/web/features/<feature>/` (`components/`, `hooks/`, `queries.ts`, `types.ts`).
- DTO contracts from the API are mapped directly into clean frontend domain models using `Schema<"Model">`.
- TypeScript compile-time checking is the primary safety mechanism for internal API data.
- UI components MUST be decomposed into cohesive subcomponents and focused custom hooks (< 150-250 lines per component), avoiding monolithic god-components.
- *Rationale*: Prevents spaghetti dependencies, eliminates cross-feature import tangles, and maximizes maintainability and component reusability.

### IV. Test-Driven Verification & Quality Gates (NON-NEGOTIABLE)
Every change to application logic or API contracts MUST be verified:
- Backend: Pytest suites (`uv run pytest`) MUST cover use cases, domain state transitions, scoring logic, and edge cases.
- Frontend: TypeScript type checking (`npm run type-check`) and linting (`npm run lint`) MUST pass with zero errors.
- Pre-commit verification (`make check` / `make api-lint` + `make type-check`) MUST verify formatting, linting, type integrity, and unit tests before any commit is accepted into git history.
- *Rationale*: Guarantees regressions are caught immediately at the developer workstation before reaching staging or production.

### V. Authority, Timing & In-Memory Computation Separation
State, timing authority, and persistence MUST have a single, unambiguous owner:
- Client holds UI interaction state (finite state machines for turns, navigation palettes, countdown displays).
- Server holds persistence, authorization, scoring calculation, expiration enforcement, and anti-cheat validation authority.
- **Timing & Grace Periods**: Server strictly governs exam expirations with standard tolerance windows (10-second patch cutoff to reject late answer tampering, 60-second submit grace window to absorb client network latency at deadline).
- **In-Memory Computation over Unneeded Migrations**: Derived metrics that can be calculated from immutable event records or snapshots (such as `correct_count`, `total_questions`, or review state) SHOULD be calculated in-memory during scoring or presentation rather than mutating database table schemas without justification.
- Idempotency MUST be enforced for critical actions (submitting answers, finalizing attempts, claiming rewards).
- *Rationale*: Eliminates race conditions, clock drift vulnerabilities, and unneeded database migration overhead.

## Technology Standards & Monorepo Tooling

The project MUST strictly adhere to the standardized tooling stack:
- **Monorepo Management**: Root `Makefile` orchestrates development, testing, linting, and API generation tasks.
- **Backend Stack**: Python 3.11+, `uv` package manager, FastAPI, Dishka (dependency injection), SQLModel / SQLAlchemy, PostgreSQL, and Alembic for database migrations.
- **Frontend Stack**: Next.js 14 (App Router), React 18, TypeScript 5, Tailwind CSS, TanStack Query v5 for server state.
- **Tooling Standards**: `ruff` for Python formatting and linting; ESLint & Prettier for TypeScript/JavaScript.

## Development Workflow & Quality Gates

Development MUST follow a disciplined lifecycle:
1. **API Changes**: When modifying backend endpoints or schemas, ensure explicit `response_model` is defined, then run `make generate-api` (`npm run generate:api`) to synchronize frontend contract types.
2. **Database Changes**: Schema updates require an explicit Alembic migration generated via `make alembic-revision MSG="description"` and applied via `make migrate`.
3. **Pre-Commit Verification**: Run the full verification suite before committing:
   - Python linting and formatting (`make api-lint` or `ruff check apps/api apps/worker --fix`).
   - Frontend linting (`npm run lint`) and TypeScript verification (`npm run type-check`).
   - Automated unit and regression tests (`uv run pytest`).
4. **Code Reviews**: Code changes must satisfy all core principles without introducing untested legacy backward-compatibility shims.

## Governance

This Constitution is the supreme development policy for the `dut-ai-quiz` project:
- **Precedence**: The principles defined in this constitution supersede informal practices, personal preferences, or ad-hoc conventions.
- **Amendments**: Amendments require formal documentation, explicit justification, a semantic version increment, and team consensus.
- **Versioning Policy**: Semantic versioning MUST be applied:
  - **MAJOR** (e.g., 2.0.0): Incompatible principle removal or core architectural shift.
  - **MINOR** (e.g., 1.1.0): New principles, expanded guidance, or added technology standards.
  - **PATCH** (e.g., 1.0.1): Clarifications, wording corrections, or minor adjustments.
- **Compliance**: All pull requests, architecture decisions, and code reviews MUST verify compliance with this Constitution.

**Version**: 1.1.0 | **Ratified**: 2026-10-25 | **Last Amended**: 2026-11-07
