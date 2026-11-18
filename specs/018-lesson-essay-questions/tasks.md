---

description: "Actionable, dependency-ordered task list for Lesson Essay Questions & Reference Answers"
---

# Tasks: Lesson Essay Questions & Reference Answers

**Input**: Design documents from `/specs/018-lesson-essay-questions/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/lesson-essay-questions-api.yaml`, `quickstart.md`

**Tests**: Included per Constitution Principle IV (Test-Driven Verification & Quality Gates — backend Pytest coverage and frontend type-check/lint gates are mandatory).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each increment.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: User story label (`[US1]`, `[US2]`, `[US3]`) — present only in User Story phases
- Exact repository-relative file paths are included in every task

## Path Conventions

- **Backend (`apps/api`)**: `apps/api/app/`, `apps/api/alembic/versions/`, `apps/api/test/`
- **Frontend (`apps/web`)**: `apps/web/app/`, `apps/web/features/lessons/`, `apps/web/components/`, `apps/web/types/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install shared dependency required for safe Markdown sanitization.

- [X] T001 Install `rehype-sanitize` dependency in `apps/web/package.json` (`cd apps/web && npm install rehype-sanitize`) to support safe raw-HTML sanitization in Markdown rendering (FR-008)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core backend domain entity, PostgreSQL persistence table & migration, repository + Dishka DI wiring, and shared Pydantic schemas that ALL user stories depend on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T002 [P] Create `LessonEssayQuestionEntity` dataclass (`id: UUID`, `lesson_id: UUID`, `question_md: str`, `answer_md: str`, `order: int = 0`, `created_at: datetime | None = None`, `updated_at: datetime | None = None`) in `apps/api/app/domain/entities/lesson_essay_question.py`
- [X] T003 [P] Create `ILessonEssayQuestionRepository` protocol (`list_by_lesson_id`, `replace_lesson_essay_questions`) in `apps/api/app/domain/interfaces/lesson_essay_question_repo.py` and export it in `apps/api/app/domain/interfaces/__init__.py`
- [X] T004 Create `LessonEssayQuestion` SQLAlchemy model for table `lesson_essay_questions` with exact constraints (`id: UUID PRIMARY KEY NOT NULL default uuid4()`, `lesson_id: UUID FOREIGN KEY (lessons.id) ON DELETE CASCADE NOT NULL INDEX`, `question_md: TEXT NOT NULL`, `answer_md: TEXT NOT NULL`, `order: INTEGER NOT NULL default 0 server_default "0"`, `created_at: TIMESTAMP NOT NULL default now_ict()`, `updated_at: TIMESTAMP NOT NULL default now_ict() onupdate now_ict()`) plus `to_entity()`/`from_entity()` in `apps/api/app/infrastructure/persistence/models/lesson_essay_question.py`, and register `LessonEssayQuestion` in `apps/api/app/infrastructure/persistence/models/__init__.py`
- [X] T005 Generate and apply Alembic migration for `lesson_essay_questions` table (`pk_lesson_essay_questions`, `fk_lesson_essay_questions_lesson_id` with `ON DELETE CASCADE`, and `ix_lesson_essay_questions_lesson_id` index) in `apps/api/alembic/versions/` via `make alembic-revision MSG="create lesson_essay_questions table"` and `make migrate`
- [X] T006 Implement `LessonEssayQuestionRepository` (`list_by_lesson_id` ordered by `order ASC, created_at ASC`; atomic `replace_lesson_essay_questions` preserving existing matching `id` & `created_at`, updating modified items, inserting new items, and deleting removed items within the transaction) in `apps/api/app/infrastructure/repositories/lesson_essay_questions.py`, export in `apps/api/app/infrastructure/repositories/__init__.py`, and register `lesson_essay_question_repo = provide(LessonEssayQuestionRepository, provides=ILessonEssayQuestionRepository)` in `apps/api/app/infrastructure/di/repositories.py`
- [X] T007 Add Pydantic schemas `LessonEssayQuestionCreate` (`id: UUID | None = None`, `question_md: str` rejecting empty/whitespace-only via `len(v.strip()) > 0`, `answer_md: str` rejecting empty/whitespace-only via `len(v.strip()) > 0`, `order: int = Field(default=0, ge=0)`), `LessonEssayQuestionBatchSync` (`essay_questions: list[LessonEssayQuestionCreate] = []`), `LessonEssayQuestionOut` (`id: UUID`, `lesson_id: UUID`, `question_md: str`, `answer_md: str`, `order: int`, `created_at: datetime`, `updated_at: datetime`, `model_config = {"from_attributes": True}`), and extend `LessonDetailOut` with `essay_questions: list[LessonEssayQuestionOut] = []` in `apps/api/app/presentation/schemas/lessons.py`

**Checkpoint**: Database schema, domain/repository layers, DI binding, and API schema contracts are ready — user story implementation can begin.

---

## Phase 3: User Story 1 - Learner Reflects on Essay Questions and Reveals Reference Answers (Priority: P1) 🎯 MVP

**Goal**: Learners navigate to a dedicated `"Câu hỏi tự luận"` tab (`/lessons/[slug]/essay`), read ordered Markdown essay questions with 100% of reference answers hidden by default (read-and-reflect only, no input box), independently click `"Hiển thị đáp án"` / `"Ẩn đáp án"` on any card, and see a friendly empty state when a lesson has no essay questions.

**Independent Test**: Open `/lessons/{slug}/essay` for a lesson seeded with 2+ essay questions, confirm the `"Câu hỏi tự luận"` tab is active and all reference answers are initially hidden with no answer input field, click `"Hiển thị đáp án"` on Question 1 to verify only Question 1 expands smoothly and its label switches to `"Ẩn đáp án"`, click `"Ẩn đáp án"` to collapse it, and verify a lesson with 0 essay questions shows the friendly empty state.

### Implementation & Tests for User Story 1

- [X] T008 [P] [US1] Implement `ListLessonEssayQuestionsUseCase` (verify lesson exists via `ILessonRepository.get` -> raise `NotFoundException("Lesson not found!")` if missing, return `list[LessonEssayQuestionEntity]` from `ILessonEssayQuestionRepository.list_by_lesson_id`) in `apps/api/app/application/use_cases/lessons/list_lesson_essay_questions_uc.py`, export in `apps/api/app/application/use_cases/lessons/__init__.py`, and register `list_lesson_essay_questions_use_case = provide(ListLessonEssayQuestionsUseCase, scope=Scope.REQUEST)` in `apps/api/app/infrastructure/di/use_cases.py`
- [X] T009 [P] [US1] Inject `ILessonEssayQuestionRepository` into `GetLessonBySlugUseCase` (`apps/api/app/application/use_cases/lessons/get_lesson_by_slug_uc.py`) and `GetLessonDetailUseCase` (`apps/api/app/application/use_cases/lessons/get_lesson_detail_uc.py`) so both return `"essay_questions": essay_questions` in their lesson detail payload
- [X] T010 [US1] Add `GET /api/v1/lessons/{lesson_id}/essay-questions` (`response_model=list[LessonEssayQuestionOut]`, authenticated `CurrentUser`, delegating to `FromDishka[ListLessonEssayQuestionsUseCase]`) in `apps/api/app/presentation/api/routers/lessons.py`
- [X] T011 [US1] Regenerate OpenAPI types via `make generate-api` into `apps/web/types/api.generated.d.ts`, export contract-derived types `LessonEssayQuestion = Schema<"LessonEssayQuestionOut">`, `LessonEssayQuestionCreate = Schema<"LessonEssayQuestionCreate">`, and `LessonDetail = Schema<"LessonDetailOut">` in `apps/web/features/lessons/types.ts`, and update `useLesson` / `useLessonBySlug` plus add `useLessonEssayQuestions(lessonId)` in `apps/web/features/lessons/queries.ts` using `apiGet<...>` without redundant response Zod stripping
- [X] T012 [P] [US1] Create `EssayQuestionCard` component rendering question index badge, formatted Markdown question via `<Markdown />`, independent `"Hiển thị đáp án"` / `"Ẩn đáp án"` toggle button, smoothly revealed Markdown reference answer panel (hidden by default, no answer input box, no purple/violet hex colors) in `apps/web/features/lessons/components/essay/essay-question-card.tsx`
- [X] T013 [US1] Create `LessonEssayTab` component managing ephemeral per-session `revealedIds: Set<string>` (initialized empty on mount and reset when `lesson.id` changes), rendering ordered `EssayQuestionCard` items, and showing friendly empty state (`"Chưa có câu hỏi tự luận cho bài học này"` + link back to `/lessons/${slug}`) when `essay_questions` is empty in `apps/web/features/lessons/components/essay/lesson-essay-tab.tsx`
- [X] T014 [P] [US1] Add `"Câu hỏi tự luận"` tab item (`id: "essay"`, Lucide icon, `href: "${basePath}/essay${querySuffix}"`, active match on `/essay`) immediately after `"Video"` in `apps/web/features/lessons/components/lesson-tabs-bar.tsx`
- [X] T015 [US1] Create Next.js learner tab page consuming `useLessonContext()` and rendering `LessonEssayTab` in `apps/web/app/(root)/lessons/[slug]/(tabs)/essay/page.tsx`
- [X] T016 [US1] Create Pytest suite testing `ListLessonEssayQuestionsUseCase`, `GetLessonBySlugUseCase`, and `GetLessonDetailUseCase` (ordered retrieval by `order ASC, created_at ASC`, empty list return `[]`, and 404 `NotFoundException` when lesson does not exist) in `apps/api/test/test_lesson_essay_questions.py`

**Checkpoint**: User Story 1 (MVP) is fully functional and independently verifiable end-to-end.

---

## Phase 4: User Story 2 - Educator Creates and Manages Markdown Essay Questions for a Lesson (Priority: P2)

**Goal**: Educators/Admins create, edit, reorder, and delete individual Markdown Question–Answer pairs with live formatted preview directly inside the lesson editor (Step 4), with non-empty validation, `MANAGE_LESSON` authorization enforcement, cascade deletion integrity, and save-failure resilience that keeps unsaved edits intact.

**Independent Test**: Sign in as an educator, open `/teacher/lessons/{id}/edit`, navigate to Step 4 `"Câu hỏi tự luận"`, verify blank/whitespace inputs are rejected inline, add 2 Markdown Q&A pairs, verify live rendered preview in both inline preview and right-side split preview, edit and reorder them, click Save, confirm changes persist in both `/teacher/lessons/{id}/edit?step=4` and learner `/lessons/{slug}/essay`, and verify a non-educator receives HTTP 403 on `PUT /api/v1/lessons/{id}/essay-questions`.

### Implementation & Tests for User Story 2

- [X] T017 [US2] Implement `SyncLessonEssayQuestionsUseCase` (verify lesson exists -> raise `NotFoundException("Lesson not found!")` if missing, trim `question_md` and `answer_md` and reject empty/whitespace-only content, preserve matching existing UUID or assign `uuid4()`, normalize sequential `order` `0..N-1`, and persist via `ILessonEssayQuestionRepository.replace_lesson_essay_questions`) in `apps/api/app/application/use_cases/lessons/sync_lesson_essay_questions_uc.py`, export in `apps/api/app/application/use_cases/lessons/__init__.py`, and register `sync_lesson_essay_questions_use_case = provide(SyncLessonEssayQuestionsUseCase, scope=Scope.REQUEST)` in `apps/api/app/infrastructure/di/use_cases.py`
- [X] T018 [US2] Add `PUT /api/v1/lessons/{lesson_id}/essay-questions` (`payload: LessonEssayQuestionBatchSync`, `response_model=list[LessonEssayQuestionOut]`, restricted to `EducatorUser` / `MANAGE_LESSON`, delegating to `FromDishka[SyncLessonEssayQuestionsUseCase]`) in `apps/api/app/presentation/api/routers/lessons.py`, then regenerate `apps/web/types/api.generated.d.ts` via `make generate-api`
- [X] T019 [P] [US2] Add `LessonEssayQuestionDraftSchema` (Zod validation for untrusted form input enforcing `question_md.trim().length > 0` and `answer_md.trim().length > 0`) in `apps/web/features/lessons/types.ts` and add `useSyncLessonEssayQuestions(lessonId)` mutation hook (calling `apiPut<LessonEssayQuestion[]>('/api/v1/lessons/${lessonId}/essay-questions', { essay_questions })` and invalidating `["lessons"]` and `["lessons", "by-slug"]` queries) in `apps/web/features/lessons/queries.ts`
- [X] T020 [P] [US2] Create `LessonEssayFormSection` component providing Add/Edit Question–Answer Markdown form (two Markdown textareas with inline Write/Preview toggle using `<Markdown />`, inline validation errors for blank/whitespace input, save/cancel edit controls) and ordered list of added Q&A items with Edit, Move Up, Move Down, and Delete buttons in `apps/web/features/lessons/components/essay/lesson-essay-form-section.tsx`
- [X] T021 [P] [US2] Update `LessonEditorStepper` (`apps/web/features/lessons/components/editor/lesson-editor-stepper.tsx`) and `LessonEditorFooter` (`apps/web/features/lessons/components/editor/lesson-editor-footer.tsx`) to support 4 steps (`1 | 2 | 3 | 4`), keeping Step 3 as `"Nội dung Markdown"` and adding Step 4 `"Câu hỏi tự luận ({essayCount})"` with Save CTA on Step 4 (and keeping Save accessible from header)
- [X] T022 [P] [US2] Extend `LessonPreviewPanel` in `apps/web/features/lessons/components/editor/lesson-preview-panel.tsx` to render a live learner-accurate preview of the lesson's essay questions (including any active draft being typed and working `"Hiển thị đáp án"` / `"Ẩn đáp án"` toggles) whenever `currentStep === 4`
- [X] T023 [US2] Integrate Step 4 into `LessonEditorPage` (`apps/web/features/lessons/components/lesson-editor-page.tsx`): initialize & sync `essayQuestions` state from `initialData?.essay_questions`, support `?step=4` while preserving `?step=3` Notion import behavior, mount `LessonEssayFormSection` on Step 4, pass live essay items + active draft to `LessonPreviewPanel`, and call `syncEssayQuestions` in `onSubmit` with error handling that shows `toast.error(...)` and aborts `handleBack()` so unsaved Markdown edits are never lost on failure
- [X] T024 [US2] Expand `apps/api/test/test_lesson_essay_questions.py` with Pytest tests covering `SyncLessonEssayQuestionsUseCase` (create, update preserving IDs, reorder, delete, clear to empty `[]`), Pydantic 422 rejection of empty/whitespace-only `question_md` and `answer_md`, 404 on non-existent lesson, HTTP 403 enforcement for non-educators on `PUT`, and `ON DELETE CASCADE` foreign key constraint verification on `LessonEssayQuestion`

**Checkpoint**: User Stories 1 and 2 are both complete and independently testable (educators author Markdown Q&A, learners reflect and reveal answers).

---

## Phase 5: User Story 3 - Rich Markdown Formatting & Bulk Reveal Controls for Study Review (Priority: P3)

**Goal**: Ensure rich technical Markdown elements (headings, nested lists, GFM tables, syntax-highlighted code blocks, KaTeX math, images, Mermaid diagrams) render safely and responsively without XSS or horizontal overflow, and provide bulk `"Hiện tất cả đáp án"` / `"Ẩn tất cả đáp án"` controls when a lesson has multiple essay questions.

**Independent Test**: Open `/lessons/{slug}/essay` for a lesson containing 2+ essay questions with code blocks, KaTeX formulas, wide tables, a Mermaid diagram, and an injected `<script>`/`onerror` payload; verify unsafe HTML is neutralized, all valid Markdown renders cleanly without page overflow on mobile and desktop viewports, and clicking `"Hiện tất cả đáp án"` / `"Ẩn tất cả đáp án"` expands and collapses all answers together.

### Implementation for User Story 3

- [X] T025 [P] [US3] Add `rehype-sanitize` immediately after `rehypeRaw` and before `rehypeKatex` with a custom sanitize schema (extending `defaultSchema` to preserve `<aside>` and safe `className` tokens for code/math blocks while stripping `<script>`, `<iframe>`, `on*` event attributes, and `javascript:` URLs) in `apps/web/components/markdown.tsx`
- [X] T026 [US3] Add bulk reveal/hide toolbar (`"Hiện tất cả đáp án"` / `"Ẩn tất cả đáp án"` buttons + revealed counter badge, rendered when `essayQuestions.length >= 2` and synchronized with individual card toggle state) in `apps/web/features/lessons/components/essay/lesson-essay-tab.tsx`
- [X] T027 [US3] Audit and harden responsive layout and overflow containment (`min-w-0`, clean horizontal scrolling for wide tables, fenced code blocks, and KaTeX display formulas across desktop and mobile viewports) in `apps/web/features/lessons/components/essay/essay-question-card.tsx`

**Checkpoint**: All 3 user stories are complete, secure, responsive, and independently verified.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final cross-cutting verification, contract synchronization check, and quality gates per Constitution Principle IV.

- [X] T028 [P] Run backend unit tests and Python linting/formatting (`cd apps/api && uv run pytest test/test_lesson_essay_questions.py -v && make test && make api-lint`) and resolve any failures
- [X] T029 [P] Verify OpenAPI contract sync, TypeScript type checking, and frontend linting (`make generate-api && make type-check && make lint`) and resolve any errors
- [X] T030 Execute full project pre-commit gate (`make check`) and verify all manual E2E scenarios in `specs/018-lesson-essay-questions/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — can start immediately (`T001`).
- **Phase 2 (Foundational)**: Can run in parallel with `T001` — BLOCKS all user stories (`T002`–`T007`).
  - Within Phase 2: `T002` and `T003` run in parallel -> `T004` depends on `T002` -> `T005` depends on `T004` -> `T006` depends on `T003` & `T004` -> `T007` can run in parallel with `T004`–`T006`.
- **Phase 3 (US1 — P1 MVP)**: Starts once Phase 2 completes (`T008`–`T016`).
- **Phase 4 (US2 — P2)**: Starts once Phase 2 completes (`T017`–`T024`); frontend Step 4 preview (`T022`) reuses `EssayQuestionCard` from `T012` (so run `T022` after `T012`).
- **Phase 5 (US3 — P3)**: Starts once `T001`, `T012`, and `T013` are complete (`T025`–`T027`).
- **Phase 6 (Polish)**: Depends on Phases 3, 4, and 5 completing (`T028`–`T030`).

### User Story Dependencies

- **User Story 1 (P1)**: Independent after Phase 2 — delivers a complete learner reading & reveal MVP.
- **User Story 2 (P2)**: Independent backend after Phase 2; frontend live preview (`T022`) reuses `EssayQuestionCard` (`T012`).
- **User Story 3 (P3)**: Enhances shared `<Markdown />` (`T025`, independent after `T001`) and US1 learner components (`T026`–`T027`).

### Parallel Opportunities

- **Phase 2**: `T002` (Entity) + `T003` (Repo Interface) + `T007` (Pydantic Schemas) + `T001` (npm install) in parallel.
- **Phase 3 (US1)**:
  - Backend: `T008` (`ListLessonEssayQuestionsUseCase`) + `T009` (`GetLessonBySlugUseCase` / `GetLessonDetailUseCase`) in parallel -> `T010` (Router) -> `T011` (`make generate-api` + FE types/queries).
  - Frontend (after `T011`): `T012` (`EssayQuestionCard`) + `T014` (`LessonTabsBar`) in parallel -> `T013` (`LessonEssayTab`) -> `T015` (`essay/page.tsx`).
- **Phase 4 (US2)**:
  - Frontend (after `T018`): `T019` (Zod draft schema + mutation hook) + `T020` (`LessonEssayFormSection`) + `T021` (Stepper & Footer) + `T022` (`LessonPreviewPanel`) all in parallel -> `T023` (`LessonEditorPage` integration).
- **Phase 5 (US3)**: `T025` (`markdown.tsx` sanitization) runs in parallel with `T026` (`LessonEssayTab` bulk controls) and `T027` (`EssayQuestionCard` overflow polish).
- **Phase 6**: `T028` (Backend test/lint) + `T029` (Frontend type-check/lint) in parallel -> `T030` (`make check` + quickstart E2E).

---

## Parallel Example: User Story 2

```bash
# After T018 (PUT endpoint + OpenAPI sync), launch all 4 frontend US2 modules in parallel:
Task T019: "Add LessonEssayQuestionDraftSchema and useSyncLessonEssayQuestions in apps/web/features/lessons/types.ts & queries.ts"
Task T020: "Create LessonEssayFormSection in apps/web/features/lessons/components/essay/lesson-essay-form-section.tsx"
Task T021: "Update LessonEditorStepper and LessonEditorFooter for 4 steps"
Task T022: "Extend LessonPreviewPanel for Step 4 live essay preview"
# Then integrate into LessonEditorPage (T023) and run backend tests (T024).
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete **Phase 1: Setup** (`T001`) and **Phase 2: Foundational** (`T002`–`T007`).
2. Complete **Phase 3: User Story 1** (`T008`–`T016`).
3. **STOP & VALIDATE**: Verify `/lessons/[slug]/essay` renders seeded Markdown Q&A, hides answers by default, toggles independently, shows empty state cleanly, and passes `test_lesson_essay_questions.py`.

### Incremental Delivery

1. **Foundation (`T001`–`T007`)** -> DB migration, domain/repo/DI, Pydantic contracts ready.
2. **US1 MVP (`T008`–`T016`)** -> Learners can study essay questions and toggle answers on the dedicated tab.
3. **US2 (`T017`–`T024`)** -> Educators can create, edit, reorder, delete, and live-preview Markdown Q&A inside Lesson Editor Step 4.
4. **US3 (`T025`–`T027`)** -> Sanitized rich Markdown + bulk Show/Hide All controls + mobile overflow hardening.
5. **Polish (`T028`–`T030`)** -> Full `make test`, `make lint`, `make type-check`, `make check`, and `quickstart.md` validation.

---

## Notes

- `[P]` marks tasks touching separate files with no unmet dependencies.
- All frontend API response types MUST derive from `Schema<"...">` in `apps/web/types/api.ts` (zero duplicate manual Zod response schemas per Constitution Principle II).
- Preserve `?step=3` deep linking in `LessonEditorPage` for Notion import compatibility.
- Keep all UI colors aligned with the existing lesson theme (no purple/violet hex codes).
