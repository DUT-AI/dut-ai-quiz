# Implementation Plan: Lesson Essay Questions & Reference Answers

**Branch**: `018-lesson-essay-questions` | **Date**: 2026-11-18 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/018-lesson-essay-questions/spec.md`

## Summary

Add self-study Markdown essay reflection questions with toggleable reference answers for every lesson in DUT-AI Quiz:
1. **Domain & Persistence (Backend)**: Introduce `lesson_essay_questions` PostgreSQL table (`lesson_id` FK with `ON DELETE CASCADE`), `LessonEssayQuestionEntity`, `ILessonEssayQuestionRepository`, `LessonEssayQuestionRepository`, and Alembic migration.
2. **Application & API Contracts (Backend)**: Implement `ListLessonEssayQuestionsUseCase` and `SyncLessonEssayQuestionsUseCase`, wire into Dishka DI, expose `GET /api/v1/lessons/{lesson_id}/essay-questions` (`CurrentUser`) and `PUT /api/v1/lessons/{lesson_id}/essay-questions` (`EducatorUser`), and include `essay_questions: list[LessonEssayQuestionOut] = []` in `LessonDetailOut` (returned by `GetLessonBySlugUseCase` and `GetLessonDetailUseCase`). Synchronize OpenAPI types via `make generate-api`.
3. **Markdown Safety & Rendering (Frontend)**: Reuse `apps/web/components/markdown.tsx` (`<Markdown />`) across learner and educator views and add `rehype-sanitize` before `rehypeKatex` so untrusted HTML is safely neutralized while preserving GFM tables, syntax-highlighted code blocks, KaTeX math, Mermaid diagrams, and `<aside>` callouts.
4. **Learner Experience (Frontend)**: Add dedicated `/lessons/[slug]/essay` route under the existing `(tabs)` layout, add the `"Câu hỏi tự luận"` tab to `LessonTabsBar`, display ordered essay question cards with answers hidden by default, independent `"Hiển thị đáp án"` / `"Ẩn đáp án"` toggles, bulk `"Hiện tất cả đáp án"` / `"Ẩn tất cả đáp án"` controls, and an empty state when none exist.
5. **Educator Experience (Frontend)**: Extend `LessonEditorPage`, `LessonEditorStepper`, `LessonEditorFooter`, and `LessonPreviewPanel` with Step 4 (`Câu hỏi tự luận`) allowing educators to create, edit, reorder, delete, and live-preview individual Markdown Question–Answer pairs, with save-error resilience that preserves unsaved edits on failure.

## Technical Context

**Language/Version**: Python 3.12 (`apps/api`), TypeScript 5 & Node.js 20+ (`apps/web`)

**Primary Dependencies**: FastAPI, Pydantic v2, Dishka (DI), SQLAlchemy 2 (async), Alembic (`apps/api`); Next.js 14 (App Router), React 18, Tailwind CSS, TanStack Query v5, React Hook Form + Zod (form validation only), Framer Motion, Lucide React, `react-markdown`, `remark-gfm`, `remark-math`, `rehype-raw`, `rehype-sanitize`, `rehype-katex`, `mermaid` (`apps/web`)

**Storage**: PostgreSQL (`lesson_essay_questions` table linked to `lessons.id` with `ON DELETE CASCADE`)

**Testing**: Pytest (`uv run pytest`), TypeScript compiler (`npm run type-check`), ESLint (`npm run lint`), Ruff (`uv run ruff check`), `make check`

**Target Platform**: Linux/macOS Dockerized API server & Modern Web Browsers (Desktop & Mobile viewports)

**Project Type**: Full-stack Monorepo Web Application (`apps/api` + `apps/web`)

**Performance Goals**: Answer reveal/hide toggle transition < 1s (client-side instant state transition, zero network round-trip); lesson essay tab render < 1s leveraging `LessonDetailOut` hydration; API endpoint latency < 50ms p95

**Constraints**: Strict Lightweight DDD layering; explicit FastAPI `response_model` and OpenAPI-generated frontend types (`Schema<"...">`) with zero duplicate response Zod schemas; no purple/violet UI hex colors; safe Markdown HTML sanitization without breaking KaTeX or Mermaid; preserve `?step=3` Notion import compatibility in `LessonEditorPage`

**Scale/Scope**: 1 new DB table, 1 Alembic migration, 1 domain entity + repo interface/implementation, 2 new use cases + 2 extended use cases, 2 new API endpoints + `LessonDetailOut` extension, 1 new Next.js lesson tab route, `LessonTabsBar` update, 3 modular frontend components (`LessonEssayTab`, `EssayQuestionCard`, `LessonEssayFormSection`), and `LessonEditorPage` Step 4 integration

## Constitution Check

*GATE: Evaluated before Phase 0 research and re-checked after Phase 1 design.*

- [x] **Principle I — Lightweight DDD**:
  - `domain/entities/lesson_essay_question.py` (`LessonEssayQuestionEntity`)
  - `domain/interfaces/lesson_essay_question_repo.py` (`ILessonEssayQuestionRepository`)
  - `infrastructure/persistence/models/lesson_essay_question.py` (`LessonEssayQuestion` SQLAlchemy model)
  - `infrastructure/repositories/lesson_essay_questions.py` (`LessonEssayQuestionRepository`)
  - `application/use_cases/lessons/list_lesson_essay_questions_uc.py` & `sync_lesson_essay_questions_uc.py`
  - `presentation/schemas/lessons.py` & `presentation/api/routers/lessons.py` (no direct DB queries or repo calls in router; explicit `response_model` on every route)
  - Dishka DI registrations in `apps/api/app/infrastructure/di/repositories.py` and `use_cases.py`
- [x] **Principle II — Single Source of Truth API Contracts**:
  - Explicit Pydantic `response_model` (`list[LessonEssayQuestionOut]`, `LessonDetailOut`) and typed request body (`LessonEssayQuestionBatchSync`).
  - Canonical `id` identifier on `LessonEssayQuestionOut` (no dual `id`/`question_id` aliasing).
  - Frontend types generated via `make generate-api` and consumed via `Schema<"LessonEssayQuestionOut">` and `Schema<"LessonEssayQuestionCreate">` with **zero duplicate manual Zod response schemas**.
  - `useLesson` and `useLessonBySlug` updated to avoid legacy Zod response stripping of `essay_questions`.
  - Zod reserved strictly for educator form input validation (`LessonEssayQuestionDraftSchema`).
- [x] **Principle III — Feature-First Frontend Architecture**:
  - All new components reside under `apps/web/features/lessons/components/essay/` and stay cohesive and focused (< 250 lines each).
  - Route page `apps/web/app/(root)/lessons/[slug]/(tabs)/essay/page.tsx` reuses `LessonProvider` / `useLessonContext()`.
- [x] **Principle IV — Test-Driven Verification & Quality Gates**:
  - Dedicated Pytest suite `apps/api/test/test_lesson_essay_questions.py` covering ordering, batch sync (create/update/reorder/delete/clear), whitespace validation errors, 404 lesson-not-found, 403 authorization, and cascade delete.
  - Full verification gate (`make generate-api`, `make test`, `make lint`, `make type-check`, `make check`).
- [x] **Principle V — Authority, Timing & In-Memory Computation Separation**:
  - Server owns persistence, authorization (`EducatorUser` / `MANAGE_LESSON`), validation, and cascade deletion.
  - Client owns ephemeral per-session answer visibility state (`Set<string>`), defaulting to all hidden on mount.

*Post-Phase 1 Re-Check*: **PASS** — Zero violations; no deviations requiring Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/018-lesson-essay-questions/
├── spec.md                                     # Feature specification (Ready for Planning)
├── plan.md                                     # This file (/speckit-plan output)
├── research.md                                 # Phase 0 architectural & codebase decisions
├── data-model.md                               # Phase 1 ER diagram, DB schema, entities, contracts
├── quickstart.md                               # Phase 1 runnable & manual validation guide
├── contracts/
│   └── lesson-essay-questions-api.yaml         # Phase 1 OpenAPI 3.1 interface contract
├── checklists/
│   └── requirements.md                         # Specification quality checklist (16/16 pass)
└── tasks.md                                    # Phase 2 output (/speckit-tasks - not created here)
```

### Source Code (repository root)

```text
apps/api/
├── alembic/versions/
│   └── xxxx_create_lesson_essay_questions_table.py
├── app/
│   ├── domain/
│   │   ├── entities/
│   │   │   └── lesson_essay_question.py
│   │   └── interfaces/
│   │       ├── __init__.py
│   │       └── lesson_essay_question_repo.py
│   ├── infrastructure/
│   │   ├── persistence/models/
│   │   │   ├── __init__.py
│   │   │   └── lesson_essay_question.py
│   │   ├── repositories/
│   │   │   ├── __init__.py
│   │   │   └── lesson_essay_questions.py
│   │   └── di/
│   │       ├── repositories.py
│   │       └── use_cases.py
│   ├── application/
│   │   └── use_cases/lessons/
│   │       ├── __init__.py
│   │       ├── list_lesson_essay_questions_uc.py
│   │       ├── sync_lesson_essay_questions_uc.py
│   │       ├── get_lesson_by_slug_uc.py
│   │       └── get_lesson_detail_uc.py
│   └── presentation/
│       ├── schemas/
│       │   └── lessons.py
│       └── api/routers/
│           └── lessons.py
└── test/
    └── test_lesson_essay_questions.py

apps/web/
├── package.json                                # Add rehype-sanitize
├── components/
│   └── markdown.tsx                            # Add rehype-sanitize (pre-KaTeX) for safe HTML sanitization
├── types/
│   └── api.generated.d.ts                      # Regenerated via make generate-api
├── app/(root)/lessons/[slug]/(tabs)/
│   └── essay/
│       └── page.tsx                            # Learner route: /lessons/[slug]/essay
└── features/lessons/
    ├── types.ts                                # Contract-derived LessonEssayQuestion types + form input schema
    ├── queries.ts                              # useLessonEssayQuestions, useSyncLessonEssayQuestions, fix LessonDetail typing
    └── components/
        ├── lesson-tabs-bar.tsx                 # Add "Câu hỏi tự luận" tab item
        ├── lesson-editor-page.tsx              # Extend to 4 steps + resilient essay sync on save
        ├── editor/
        │   ├── lesson-editor-stepper.tsx       # Add Step 4: Câu hỏi tự luận ({essayCount})
        │   ├── lesson-editor-footer.tsx        # Update step 3->4 navigation & step 4 Save CTA
        │   └── lesson-preview-panel.tsx        # Support live preview of essay questions on Step 4
        └── essay/
            ├── lesson-essay-tab.tsx            # Learner tab view (header, bulk toggle, list, empty state)
            ├── essay-question-card.tsx         # Single Q&A card with Markdown + "Hiển thị/Ẩn đáp án" toggle
            └── lesson-essay-form-section.tsx   # Educator Step 4 form (add/edit/reorder/delete + inline preview)
```

**Structure Decision**: Extends the existing monorepo web application structure (`apps/api` Lightweight DDD backend + `apps/web` feature-first Next.js App Router frontend), mirroring the established `lesson_videos` module inside `features/lessons/` and `use_cases/lessons/` while upgrading contract consumption to Constitution v1.1.0 (`Schema<"...">`).

## Complexity Tracking

> No Constitution violations were identified; this table is intentionally empty.

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --- | --- | --- |
| *None* | *N/A* | *N/A* |
