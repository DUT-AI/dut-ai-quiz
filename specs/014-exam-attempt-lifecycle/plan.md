# Implementation Plan: Exam Attempt Lifecycle, Scoring & Anti-Cheat Overhaul

**Branch**: `014-exam-attempt-lifecycle` | **Date**: 2026-11-07 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/014-exam-attempt-lifecycle/spec.md`

## Summary

This plan provides a comprehensive architectural refactoring of the exam attempt lifecycle in DUT-AI Quiz across backend (`apps/api`) and frontend (`apps/web`):
1. **Dual Scoring Contract**: Update backend scoring to compute both `score` (10-point scale), `correct_count`, and `total_questions`. Refactor the frontend review page to display `{score} / 10 ĐIỂM` and `{correct_count} / {total_questions} CÂU ĐÚNG` with accurate percentage strokes, fixing the critical percentage inversion bug.
2. **Quota & Active Attempt State Machine**: Enforce `max_attempts` strictly in `StartAttemptUseCase` using existing repository counters. Introduce active attempt resumption (`is_resumed`) and restart capabilities (`ABANDONED`) to prevent orphaned sessions.
3. **Grace Window & Late Patch Prevention**: Introduce a 60-second network grace window for submissions, and reject answer patching once the attempt has passed its official deadline (`expires_at + 10s`). Include server timestamp to neutralize client clock skew.
4. **Resilient Anti-Cheat System**: Add a 2.0-second grace window to `mouse_leave` detection, eliminate race conditions between the 500ms heartbeat and async fullscreen transitions with a 3-second stabilization cooldown, and block macOS `e.metaKey` shortcuts.
5. **Clean Code & N+1 Query Elimination**: Add `get_by_ids` bulk retrieval in `IQuestionRepository` to reduce attempt loading from $O(N)$ to $O(1)$ database calls, reconstruct the student's `shuffle_snapshot` on review, and decompose the 617-line god-component in `apps/web` into cohesive, reusable domain hooks and components.

---

## Technical Context

**Language/Version**: Python 3.12 (Backend), TypeScript 5.x / Node.js 20+ (Frontend)  
**Primary Dependencies**:
- Backend: FastAPI, Pydantic v2, Dishka (DI), SQLAlchemy 2.0 / SQLModel, Alembic
- Frontend: Next.js 15 (App Router), React 19 / 18, TanStack Query v5, Framer Motion, Lucide React, Tailwind CSS  
**Storage**: PostgreSQL (`attempts`, `attempt_answers`, `focus_events`, `exams`, `questions`)  
**Testing**: Pytest (`uv run pytest`), TypeScript compiler (`npm run type-check`), ESLint (`npm run lint`)  
**Target Platform**: Web application (Desktop & Mobile responsive browsers)  
**Project Type**: Monorepo Web Application (`apps/api` + `apps/web`)  
**Performance Goals**:
- Attempt startup and reload response time < 50ms ($O(1)$ bulk question fetch).
- 0% false-positive strikes for mouse leaves under 2.0 seconds.  
**Constraints**:
- Strict DDD layer separation (`domain/` -> `application/` -> `infrastructure/` -> `presentation/`).
- Zero API contract drift (`make generate-api` to keep types synchronized).
- 100% test pass rate across existing test suites.  
**Scale/Scope**: 0 Alembic migrations (in-memory calculation), 5 backend use case refactorings, 1 repository interface update, 1 hook overhaul, 1 review page redesign, and 1 exam attempt page decomposition. Run `make generate-api` to keep TypeScript types aligned.

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **Principle I (Lightweight DDD)**: Concerns remain strictly separated. Domain entities (`AttemptEntity`, `ExamEntity`) hold scoring and business access logic; use cases (`StartAttemptUseCase`, `SubmitAttemptUseCase`, `GetAttemptUseCase`, `ReviewAttemptUseCase`, `PatchAttemptAnswersUseCase`) coordinate application flows; repositories handle persistence; routers in `presentation/` contain zero business rules.
- [x] **Principle II (Single Source of Truth API Contracts)**: Endpoints in `presentation/api/routers/attempts.py` define explicit Pydantic response models (`AttemptOut`, `StartAttemptOut`). Frontend types in `apps/web/features/attempts/types.ts` mirror backend contracts without drift.
- [x] **Principle III (Feature-First Frontend)**: All frontend attempt logic, hooks, and subcomponents reside within `apps/web/features/attempts/` and route pages under `app/(root)/exams/[id]/attempt/`.
- [x] **Principle IV (Test-Driven Verification)**: Covered by comprehensive Pytest suites verifying scoring calculation, `max_attempts` boundary checks, late submission cutoffs, and TypeScript type-check validation.
- [x] **Principle V (Authority & State Separation)**: The server retains authoritative control over timer validation, `tab_out_count` evaluation, expiration deadlines, and score calculation. Client state only reflects UI feedback and debounced pending answers.

---

## Project Structure

### Documentation (this feature)

```text
specs/014-exam-attempt-lifecycle/
├── plan.md              # Master Implementation Plan (this file)
├── research.md          # Technical research & architectural decisions (Phase 0)
├── data-model.md        # Class diagrams, entities, migrations, and interfaces (Phase 1)
├── quickstart.md        # Verification scenarios & test commands (Phase 1)
├── contracts/           # API contract definitions (Phase 1)
│   └── attempt-api.yaml
└── tasks.md             # Generated by /speckit-tasks
```

### Source Code Impact

```text
apps/api/
├── alembic/versions/
│   └── xxxx_add_scoring_and_timeout_to_attempts.py
├── app/
│   ├── domain/
│   │   ├── entities/
│   │   │   ├── attempt.py                       # score_attempt returns (score, correct, total)
│   │   │   └── exam.py                          # can_access fix for None user
│   │   ├── interfaces/
│   │   │   ├── attempt_repo.py                  # get_active_for_user_exam contract
│   │   │   └── question_repo.py                 # get_by_ids bulk fetch contract
│   │   └── value_objects/
│   │       └── enums.py                         # AttemptStatus.TIMED_OUT
│   ├── application/
│   │   └── use_cases/attempts/
│   │       ├── start_attempt_use_case.py        # max_attempts check, resume/restart
│   │       ├── submit_attempt_use_case.py       # 60s grace period, timeout handling
│   │       ├── attempt_use_case.py              # GetAttemptUseCase (get_by_ids), Patch (expiry check)
│   │       └── review_attempt_uc.py             # Reconstruct student's shuffle_snapshot
│   ├── infrastructure/
│   │   ├── persistence/models/
│   │   │   └── attempt.py                       # correct_count, total_questions columns
│   │   └── repositories/
│   │       ├── attempts.py                      # get_active_for_user_exam implementation
│   │       └── questions.py                     # get_by_ids bulk query implementation
│   └── presentation/
│       ├── api/routers/attempts.py              # GET /my-active-attempt, updated status codes
│       └── schemas/attempts.py                  # AttemptOut (score, correct_count, total_questions)
└── test/
    ├── test_attempt_use_cases.py                # Unit tests for attempt lifecycle & quota
    └── test_scoring.py                          # Unit tests for dual scoring

apps/web/
├── hooks/
│   └── use-anti-cheat.ts                        # 2s mouse-leave grace timer, mac shortcuts, cooldown
├── features/attempts/
│   ├── types.ts                                 # AttemptOutSchema (nullable is_correct, correct_count)
│   ├── queries.ts                               # useActiveAttempt, useStartAttempt action
│   ├── hooks/
│   │   ├── useExamSession.ts                    # Answer sync, auto-save, submission orchestration
│   │   └── useExamTimer.ts                      # Clock-skew compensated countdown
│   └── components/
│       ├── ExamHeader.tsx                       # Timer, progress, exam title
│       ├── QuestionCard.tsx                     # Markdown content, option choices
│       ├── QuestionNavigator.tsx                # Question grid palette
│       └── SubmitModal.tsx                      # Answered/unanswered review before submit
└── app/(root)/
    ├── exams/[id]/page.tsx                      # Resume / restart banner, max_attempts disable
    ├── exams/[id]/attempt/[attemptId]/page.tsx  # Decomposed exam environment page (< 150 lines)
    └── history/[attemptId]/review/page.tsx      # Accurate 10-point scale & correct count display
```

---

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| New columns `correct_count`, `total_questions` on `attempts` table | Eliminates continuous expensive question re-joins on review/leaderboards | Calculating dynamically in every query slows down history and stats pages |
| 2.0s Grace timer for `mouse_leave` | Eliminates false-positive auto-submissions when cursor crosses border | Immediate strike causes student frustration on dual-monitor or edge gestures |
| Dual query contract for questions | Eliminates N+1 query loop when loading exam presentation | Leaving N+1 queries causes database connection pool exhaustion under exam concurrency |
