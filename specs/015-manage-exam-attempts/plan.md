# Implementation Plan: Teacher View Student Exam Attempts & Hard Delete Attempt

**Branch**: `015-manage-exam-attempts` | **Date**: 2026-11-07 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/015-manage-exam-attempts/spec.md`

---

## Summary

Enable teachers and administrators to thoroughly inspect all exam attempts belonging to an individual student on a dedicated route (`/teacher/stats/[id]/students/[studentId]`), with question-by-question presentation (reconstructed according to the attempt's `shuffle_snapshot`), selected options, correct answers, and anti-cheat event logs. Provide a secure, confirmed hard-delete capability (`DELETE /api/v1/exams/{exam_id}/attempts/{attempt_id}`) that atomically cascades removal of `attempt_answers` and `focus_events`, decrements the student's used attempt count to grant a clean retake, and dynamically updates exam overview statistics.

---

## Technical Context

**Language/Version**: Python 3.12 (Backend `apps/api`), TypeScript 5.5 / Node.js 20+ (Frontend `apps/web`)  
**Primary Dependencies**: FastAPI, Dishka DI, SQLAlchemy (asyncpg), Pydantic v2, Next.js 14 (App Router), React Query (@tanstack/react-query), Tailwind CSS, Lucide Icons, Shadcn UI (Dialog)  
**Storage**: PostgreSQL (`attempts`, `attempt_answers`, `focus_events`, `exams`, `questions`)  
**Testing**: `pytest` (backend use case & repository tests), `tsc --noEmit` (frontend typecheck)  
**Target Platform**: Web browsers (Teacher desktop & tablet dashboard)  
**Project Type**: Full-stack web application (FastAPI backend + Next.js frontend)  
**Performance Goals**: Attempt deletion < 500ms; Student attempt breakdown loaded in < 800ms for 50 questions  
**Constraints**: Hard delete must execute in a single atomic database transaction; zero schema migrations required; 403 Forbidden enforced for non-educators  
**Scale/Scope**: 1-10 attempts per student, 10-100 questions per exam  

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Requirement | Plan Alignment | Status |
| :--- | :--- | :--- | :--- |
| **I. Lightweight DDD** | Explicit layer separation (presentation, application use cases, infrastructure repositories). Explicit `response_model` on all routes. No raw SQL in routes. | Routes in `exams.py` delegate to `GetStudentAttemptsUseCase` and `DeleteExamAttemptUseCase`. Repository methods handle database operations. Explicit Pydantic response models. | **PASS** |
| **II. Single Source of Truth Contracts** | Strict OpenAPI types; no manual duplicate Zod response schemas; canonical `id` identifier. | FastAPI endpoints define strict Pydantic schemas. Frontend consumes OpenAPI types via `Schema<"StudentExamAttemptsResponse">` and `Schema<"DeleteAttemptResponse">`. | **PASS** |
| **III. Feature-First Frontend** | Organize by domain features (`features/exams/`); decomposed subcomponents (< 200 lines). | Page under `app/(root)/teacher/stats/[id]/students/[studentId]/page.tsx`; modular components under `features/exams/components/exam-stats/student-attempts/`. | **PASS** |
| **IV. Test-Driven Verification** | Pytest suites for use cases; `type-check` passes with zero errors. | Pytest test suite in `apps/api/test/test_manage_student_attempts.py`; `npm run type-check` before shipping. | **PASS** |
| **V. Authority & State Separation** | Server holds authority over deletion and scoring; in-memory derived calculation over unneeded DB migrations. | Server executes cascading delete atomically; student attempt count and correctness are computed in-memory; zero database schema migrations. | **PASS** |

---

## Project Structure

### Documentation (this feature)

```text
specs/015-manage-exam-attempts/
├── spec.md              # Feature specification (completed & approved)
├── plan.md              # This implementation plan
├── research.md          # Technical decisions & rationale (Phase 0)
├── data-model.md        # Entities, schemas & cascade rules (Phase 1)
├── quickstart.md        # Verification scenarios & test commands (Phase 1)
├── contracts/           # API contract specifications (Phase 1)
│   └── student-attempts-api.yaml
└── checklists/
    └── requirements.md  # Quality checklist
```

### Source Code Impact

```text
apps/api/
├── app/
│   ├── application/
│   │   └── use_cases/
│   │       └── exams/
│   │           ├── get_student_attempts_uc.py   # NEW: Interactor for student attempts review
│   │           └── delete_exam_attempt_uc.py     # NEW: Interactor for cascading attempt deletion
│   ├── domain/
│   │   └── interfaces/
│   │       └── attempt_repo.py                  # EXTEND: delete_attempt(attempt_id)
│   ├── infrastructure/
│   │   ├── di/
│   │   │   └── use_cases.py                     # REGISTER: Dishka providers
│   │   └── repositories/
│   │       └── attempts.py                      # IMPLEMENT: atomic cascading deletion
│   └── presentation/
│       ├── api/
│       │   └── routers/
│       │       └── exams.py                     # ADD: GET /students/{id}/attempts & DELETE /attempts/{id}
│       └── schemas/
│           └── exam_attempts.py                 # NEW: Pydantic DTOs for student attempt details
└── test/
    └── test_manage_student_attempts.py          # NEW: Pytest verification suite

apps/web/
├── app/
│   └── (root)/
│       └── teacher/
│           └── stats/
│               └── [id]/
│                   ├── page.tsx                 # UPDATE: Link participant cards to student detail URL
│                   └── students/
│                       └── [studentId]/
│                           └── page.tsx         # NEW: Dedicated student attempts review & management page
└── features/
    └── exams/
        ├── components/
        │   └── exam-stats/
        │       ├── participants-tab.tsx         # UPDATE: Make cards clickable links to student page
        │       └── student-attempts/
        │           ├── student-attempt-header.tsx      # NEW: Student profile, breadcrumb & summary stats
        │           ├── student-attempt-list.tsx        # NEW: Accordion / tabs of student attempts
        │           ├── attempt-question-review.tsx     # NEW: Question cards with selected/correct choices
        │           ├── attempt-focus-timeline.tsx      # NEW: Anti-cheat event timeline
        │           └── delete-attempt-dialog.tsx       # NEW: Confirmation modal for hard deletion
        └── queries.ts                           # ADD: useStudentExamAttempts & useDeleteExamAttempt
```

**Structure Decision**: Web application with backend FastAPI domain use cases and feature-first Next.js frontend pages.

---

## Complexity Tracking

*No violations. All design choices strictly adhere to Constitution principles without introducing extra architectural bloat.*
