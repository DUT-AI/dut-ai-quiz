# Technical Research & Architectural Decisions: Lesson Essay Questions

**Feature**: `018-lesson-essay-questions`  
**Date**: 2026-11-18  
**Spec**: [spec.md](spec.md)

## Research Summary

Codebase inspection of `apps/api` and `apps/web` confirmed that the project already has a mature pattern for lesson-scoped child collections (introduced in `011-lesson-youtube-videos`), a full-featured Markdown renderer (`apps/web/components/markdown.tsx`), a multi-step lesson editor (`LessonEditorPage`), and strict contract-driven standards defined in Constitution v1.1.0.

All technical unknowns are resolved below.

---

## Decision 1: Persistence & Domain Modeling Pattern

- **Decision**: Create a dedicated `lesson_essay_questions` PostgreSQL table with `lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE`, backed by `LessonEssayQuestionEntity`, `ILessonEssayQuestionRepository`, and `LessonEssayQuestionRepository` following the exact Lightweight DDD layering of `lesson_videos`.
- **Rationale**:
  - Completely isolates open-ended self-study Markdown Q&A from the existing `questions` table (which models multiple-choice practice/exam/game questions with options, difficulty, and exam attempt foreign keys).
  - Database-level `ON DELETE CASCADE` guarantees FR-013 (deleting a lesson automatically deletes all associated essay questions with zero orphaned rows) regardless of whether deletion goes through `DeleteLessonUseCase` (which handles MCQ questions via `REASSIGN` / `UNASSIGN` / `DELETE`) or SQL cascades.
  - Preserves canonical `id` naming per Constitution Principle II.
- **Alternatives Considered**:
  - *Reusing the `questions` table with a new `PoolType.ESSAY`*: Rejected because `questions` has MCQ-specific columns (`options`, `correct_option`, `pool_type`, `difficulty`) and exam reassignment workflows in `DeleteLessonUseCase` that conflict with lesson-owned self-study essay notes.
  - *Storing essay questions as a JSONB column on `lessons`*: Rejected because individual row identifiers (`id`), ordering, schema integrity, and clean repository testing are stronger and more maintainable with a normalized table matching `lesson_videos`.

---

## Decision 2: Batch Synchronization vs. Individual CRUD Endpoints

- **Decision**: Expose `GET /api/v1/lessons/{lesson_id}/essay-questions` (`CurrentUser`) and `PUT /api/v1/lessons/{lesson_id}/essay-questions` (`EducatorUser`) for atomic batch synchronization, and include `essay_questions: list[LessonEssayQuestionOut] = []` in `LessonDetailOut` (returned by `GET /api/v1/lessons/by-slug/{slug}` and `GET /api/v1/lessons/{lesson_id}`).
- **Rationale**:
  - Matches the educator UX in `LessonEditorPage`: educators compose, edit, reorder, and remove multiple Q&A pairs locally in the lesson editor and commit the full ordered list atomically when clicking Save, preventing partial-save states or out-of-sync ordering.
  - Including `essay_questions` on `LessonDetailOut` avoids an extra client network waterfall when learners switch to `/lessons/[slug]/essay` (instant <100ms tab rendering) and hydrates `EditLessonPage` immediately, while `GET /api/v1/lessons` (list view) remains on `LessonOut` without carrying Markdown bodies.
  - Preserving existing item `id` values during `PUT` sync (when an existing UUID belonging to the lesson is passed back) keeps stable React keys and deep-linkable anchors without unnecessary churn, while still executing atomically in a single transaction.
  - Router delegates `GET` to `ListLessonEssayQuestionsUseCase` (verifying lesson existence -> 404 if missing) rather than injecting the repository directly into the router, strictly satisfying Constitution Principle I.
- **Alternatives Considered**:
  - *Separate POST/PATCH/DELETE/REORDER endpoints per question*: Rejected for v1 because `LessonEditorPage` creates new lessons (`targetId` only exists after `POST /api/v1/lessons`) and edits lesson metadata, videos, theory, and essay questions in one unified Save action.

---

## Decision 3: Single Source of Truth API Contracts (Constitution v1.1.0)

- **Decision**: Define explicit Pydantic schemas (`LessonEssayQuestionCreate`, `LessonEssayQuestionOut`, `LessonEssayQuestionBatchSync`, and `LessonDetailOut.essay_questions`) in `apps/api/app/presentation/schemas/lessons.py`, regenerate `apps/web/types/api.generated.d.ts` via `make generate-api`, and consume `Schema<"LessonEssayQuestionOut">` / `Schema<"LessonEssayQuestionCreate">` directly in `apps/web/features/lessons/types.ts` and `queries.ts`. Remove redundant manual response Zod parsing on `useLesson` and `useLessonBySlug` (or migrate them to `Schema<"LessonDetailOut">`) so `essay_questions` is never stripped by legacy Zod `z.object()` schemas. Reserve Zod strictly for educator form input validation (`LessonEssayQuestionFormSchema`).
- **Rationale**:
  - Strictly enforces Constitution Principle II ("Ban on Duplicate Zod Boilerplate").
  - Prevents a critical silent bug discovered during research: `apps/web/features/lessons/queries.ts` currently passes legacy `LessonSchema` (Zod) to `apiGet(...)` for `useLesson` and `useLessonBySlug`, which strips any keys not manually duplicated in `LessonSchema`.
- **Alternatives Considered**:
  - *Adding a duplicate `LessonEssayQuestionSchema` Zod response validator*: Rejected because it violates Constitution Principle II.

---

## Decision 4: Markdown Rendering & Safe Sanitization

- **Decision**: Reuse the existing `apps/web/components/markdown.tsx` (`<Markdown />`) component—which already supports GFM tables, nested lists, syntax-highlighted `CodeBlock`, KaTeX math (`remark-math` + `rehype-katex`), `MermaidBlock`, `<aside>` callouts, and image lightbox—and add `rehype-sanitize` (positioned immediately after `rehypeRaw` and before `rehypeKatex`) with a safe schema preserving standard Markdown HTML, `<aside>`, and code/math class attributes while stripping `<script>`, `<iframe>`, event handler attributes (`on*`), and `javascript:` URLs.
- **Rationale**:
  - Satisfies FR-008 completely: consistent rendering with lesson theory AND safe sanitization of untrusted raw HTML.
  - Running `rehype-sanitize` *before* `rehypeKatex` ensures KaTeX's generated MathML/HTML spans are never stripped while raw user HTML inside Markdown is safely neutralized.
- **Alternatives Considered**:
  - *Removing `rehypeRaw` globally*: Rejected because existing lesson theory content uses `<aside>` callouts (explicitly styled in `markdownComponents.aside`).
  - *Building a separate Markdown renderer for essay questions*: Rejected because it would duplicate KaTeX, Mermaid, and code-block styling and drift from lesson theory rendering.

---

## Decision 5: Learner Tab Route & Ephemeral Toggle State

- **Decision**:
  - Add route `apps/web/app/(root)/lessons/[slug]/(tabs)/essay/page.tsx` consuming `useLessonContext()`.
  - Add tab item `{ id: "essay", label: "Câu hỏi tự luận", icon: MessageSquareQuote, href: `${basePath}/essay${querySuffix}` }` to `LessonTabsBar` right after `Video` (before `Luyện tập`).
  - Manage revealed answer IDs in client React state (`useState<Set<string>>(() => new Set())`), initialized empty on mount so 100% of answers start hidden, supporting independent per-question toggle ("Hiển thị đáp án" / "Ẩn đáp án") and bulk toggle ("Hiện tất cả đáp án" / "Ẩn tất cả đáp án" when `questions.length >= 2`).
- **Rationale**:
  - Aligns directly with Constitution Principle V (client holds ephemeral UI interaction state; server holds persistence).
  - Follows the exact routing and styling structure of `video/page.tsx` and `LessonVideoTab`.
  - Respects design system tokens (no purple/violet hues; uses primary, emerald, slate, and amber accents consistent with existing lesson UI).
- **Alternatives Considered**:
  - *Persisting revealed state in `localStorage`*: Rejected per spec Assumptions ("Answer visibility state is scoped to the current viewing session and resets to hidden when the learner leaves and returns to the lesson").

---

## Decision 6: Educator Lesson Editor Integration & Failure Resilience

- **Decision**:
  - Extend `LessonEditorPage`, `LessonEditorStepper`, and `LessonEditorFooter` from 3 steps to 4 steps:
    1. `Thông tin chung`
    2. `Video tham khảo ({videoCount})`
    3. `Nội dung Markdown` (preserves `?step=3` deep link used by Notion import!)
    4. `Câu hỏi tự luận ({essayCount})`
  - Build `LessonEssayFormSection` with an Add/Edit form for a Question–Answer pair (two Markdown textareas with inline Write/Preview mode toggle + validation preventing empty/whitespace-only fields) and an ordered list of existing pairs with Edit, Move Up, Move Down, and Delete controls.
  - Extend `LessonPreviewPanel` so when `currentStep === 4`, the split preview displays a live learner-accurate preview of the lesson's essay questions (including any in-progress draft and working reveal toggles).
  - On `onSubmit` in `LessonEditorPage`, sync essay questions via `useSyncLessonEssayQuestions` (`PUT /api/v1/lessons/{targetId}/essay-questions`); if syncing fails, display a clear `toast.error(...)` and abort navigation (`return` before `handleBack()`) so the educator retains all unsaved Markdown edits in the editor.
- **Rationale**:
  - Preserves 100% backward compatibility with Notion import (`?step=3`).
  - Guarantees FR-010, FR-011, FR-012, and the Save Failure Resilience edge case.
- **Alternatives Considered**:
  - *Inserting essay questions as a separate standalone teacher route*: Rejected because the user specifically requested managing them directly inside the lesson management page, matching how videos are managed in `LessonEditorPage`.
