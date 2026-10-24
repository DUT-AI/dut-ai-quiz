<!--
# Sync Impact Report
- Version change: Unversioned Scaffold → 1.0.0
- List of modified principles:
  - [PRINCIPLE_1_NAME] → I. Lightweight Domain-Driven Design (Lightweight DDD)
  - [PRINCIPLE_2_NAME] → II. Single Source of Truth API Contracts (Contract-Driven)
  - [PRINCIPLE_3_NAME] → III. Feature-First Frontend Architecture
  - [PRINCIPLE_4_NAME] → IV. Test-Driven Verification & Quality Gates (NON-NEGOTIABLE)
  - [PRINCIPLE_5_NAME] → V. Authority & State Separation
- Added sections:
  - Technology Standards & Monorepo Tooling
  - Development Workflow & Quality Gates
- Removed sections: None (template slots fully populated)
- Follow-up TODOs: None
-->

# DUT-AI Quiz Constitution

## Core Principles

### I. Lightweight Domain-Driven Design (Lightweight DDD)
The backend (`apps/api`) MUST strictly separate concerns across architectural layers:
- `presentation/`: FastAPI routers, Pydantic schemas, and dependency injection (`dishka`). No direct database queries or raw SQL.
- `application/use_cases/`: Granular use case interactors (`execute(...)`) coordinating application flow.
- `application/services/`: Pure business logic (e.g. scoring, question shuffling, item application).
- `infrastructure/`: Persistence (SQLModel, repositories), external auth integration, and third-party APIs.
- *Rationale*: Keeps domain business rules decoupled from database implementations and HTTP transport, enabling fast unit testing and safe refactoring.

### II. Single Source of Truth API Contracts (Contract-Driven)
All client-server interactions MUST adhere to strict, typed schemas:
- Every FastAPI endpoint MUST define explicit Pydantic `response_model` and input body types. No untyped dictionaries or loose JSON payloads.
- The frontend (`apps/web`) MUST generate and synchronize types directly from FastAPI's OpenAPI specification using `openapi-typescript` (`make generate-api`).
- Schema definitions in `apps/web/types/api.generated.d.ts` serve as the canonical contract. Frontend features consume them via the centralized `Schema<"ModelName">` utility.
- *Rationale*: Eliminates drift between backend reality and frontend expectations, preventing runtime crashes and eliminating redundant manual type definitions.

### III. Feature-First Frontend Architecture
The frontend codebase MUST be organized by business domain features:
- Code resides in `apps/web/features/<feature>/` (`components/`, `hooks/`, `queries.ts`, `types.ts`).
- DTO contracts from the API are mapped directly into clean frontend domain models (e.g., stripping server `...Out` suffixes and refining optional array defaults).
- TypeScript compile-time checking is the primary safety mechanism for internal API data; runtime validation (Zod) is reserved strictly for untrusted user form inputs and external boundaries.
- *Rationale*: Prevents spaghetti dependencies, eliminates cross-feature import tangles, and keeps bundle size at zero runtime overhead.

### IV. Test-Driven Verification & Quality Gates (NON-NEGOTIABLE)
Every change to application logic or API contracts MUST be verified:
- Backend: Pytest suites (`uv run pytest`) MUST cover use cases, domain state transitions, scoring logic, and edge cases.
- Frontend: TypeScript type checking (`npm run type-check`) and linting (`npm run lint`) MUST pass with zero errors.
- Pre-commit hooks (`make check`) MUST verify format, lint, type integrity, and unit tests before any commit is accepted into git history.
- *Rationale*: Guarantees regressions are caught immediately at the developer workstation before reaching staging or production.

### V. Authority & State Separation
State and authority MUST have a single, unambiguous owner:
- Client holds UI interaction state (e.g. finite state machines for question turns, countdown animations).
- Server holds persistence, authorization, scoring calculation, and anti-cheat validation authority.
- No synchronization anti-patterns: Never maintain duplicate authority (e.g. simultaneous server and client countdown timers that cause drift jitter).
- Idempotency MUST be enforced for critical actions (e.g. submitting answers, claiming rewards).
- *Rationale*: Eliminates race conditions, clock drift errors, and duplicated source-of-truth bugs.

## Technology Standards & Monorepo Tooling

The project MUST strictly adhere to the standardized tooling stack:
- **Monorepo Management**: Root `Makefile` orchestrates development, testing, linting, and API generation tasks.
- **Backend Stack**: Python 3.11+, `uv` package manager, FastAPI, Dishka (dependency injection), SQLModel / SQLAlchemy, PostgreSQL, and Alembic for database migrations.
- **Frontend Stack**: Next.js 14 (App Router), React 18, TypeScript 5, Tailwind CSS, TanStack Query v5 for server state.
- **Tooling Standards**: `ruff` for Python formatting and linting; ESLint & Prettier for TypeScript/JavaScript.

## Development Workflow & Quality Gates

Development MUST follow a disciplined lifecycle:
1. **API Changes**: When modifying backend endpoints or schemas, run `make generate-api` to synchronize frontend contract types.
2. **Database Changes**: Schema updates require an explicit Alembic migration generated via `make alembic-revision MSG="description"` and applied via `make migrate`.
3. **Pre-Commit Verification**: Run `make check` to execute the full quality suite:
   - Python linting (`ruff check`) and formatting (`ruff format --check`).
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

**Version**: 1.0.0 | **Ratified**: 2026-10-25 | **Last Amended**: 2026-10-25
