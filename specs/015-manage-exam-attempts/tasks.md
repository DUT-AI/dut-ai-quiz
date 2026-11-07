---
description: "Task list for Teacher View Attempt Details & Delete/Reset Attempt"
---

# Tasks: Teacher View Attempt Details & Delete/Reset Attempt

**Input**: Design documents from `/specs/015-manage-exam-attempts/`  
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/student-attempts-api.yaml`, `quickstart.md`  
**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

---

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (`US1`, `US2`, `US3`)
- Includes exact file paths in every task description

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project schemas, DTOs, and interface definitions

- [x] T001 Define presentation schemas and DTOs (`StudentExamAttemptsResponse`, `StudentAttemptDetailOut`, `StudentAttemptQuestionDetail`, `DeleteAttemptResponse`) in `apps/api/app/presentation/schemas/exam_attempts.py`
- [x] T002 [P] Export new schemas in `apps/api/app/presentation/schemas/__init__.py` and declare interface methods `delete_attempt(attempt_id: UUID)` and `list_for_user_and_exam(exam_id: UUID, user_id: int)` in `apps/api/app/domain/interfaces/attempt_repo.py`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core repository infrastructure that MUST be complete before user stories can execute

**⚠️ CRITICAL**: Foundational tasks must complete before implementing use cases and frontend pages

- [x] T003 Implement atomic cascading attempt deletion (`attempt_answers`, `focus_events`, `attempts` within a single transaction) in `apps/api/app/infrastructure/repositories/attempts.py`
- [x] T004 [P] Implement `IAttemptRepository.list_for_user_and_exam(exam_id: UUID, user_id: int)` in `apps/api/app/infrastructure/repositories/attempts.py`
- [x] T005 [P] Register `GetStudentAttemptsUseCase` and `DeleteExamAttemptUseCase` dependencies in Dishka container in `apps/api/app/infrastructure/di/use_cases.py`

**Checkpoint**: Foundation ready - User Story 1 and User Story 2 can proceed.

---

## Phase 3: User Story 1 - Teacher Inspects Student Exam Attempts on Dedicated Page (Priority: P1) 🎯 MVP

**Goal**: An educator can click a student card on `/teacher/stats/[id]` and navigate to `/teacher/stats/[id]/students/[studentId]` to inspect all student attempts with full question-by-question breakdowns, selected options, correct answers, and anti-cheat event logs.

**Independent Test**: Navigate to `/teacher/stats/[id]/students/[studentId]`, verify that all student attempts load with questions, options, student selected choices, correctness badges, and anti-cheat event timeline.

### Tests for User Story 1 ⚠️

- [x] T006 [P] [US1] Unit test for `GetStudentAttemptsUseCase` covering question presentation reconstruction via `shuffle_snapshot` and answer matching in `apps/api/test/test_manage_student_attempts.py`

### Implementation for User Story 1

- [x] T007 [US1] Implement `GetStudentAttemptsUseCase` reconstructing question presentation from `shuffle_snapshot` and matching student answers in `apps/api/app/application/use_cases/exams/get_student_attempts_uc.py`
- [x] T008 [US1] Add `GET /api/v1/exams/{exam_id}/students/{student_id}/attempts` endpoint with `EducatorUser` guard in `apps/api/app/presentation/api/routers/exams.py`
- [x] T009 [P] [US1] Add React Query hook `useStudentExamAttempts(examId, studentId)` in `apps/web/features/exams/queries.ts` and response types in `apps/web/features/exams/types.ts`
- [x] T010 [P] [US1] Create student header component with breadcrumb and summary badges in `apps/web/features/exams/components/exam-stats/student-attempts/student-attempt-header.tsx`
- [x] T011 [P] [US1] Create question review cards displaying selected option vs correct option in `apps/web/features/exams/components/exam-stats/student-attempts/attempt-question-review.tsx`
- [x] T012 [P] [US1] Create anti-cheat focus events timeline component in `apps/web/features/exams/components/exam-stats/student-attempts/attempt-focus-timeline.tsx`
- [x] T013 [US1] Assemble dedicated student attempts review page at `apps/web/app/(root)/teacher/stats/[id]/students/[studentId]/page.tsx`
- [x] T014 [US1] Update candidate cards in `apps/web/features/exams/components/exam-stats/participants-tab.tsx` to link to `/teacher/stats/[id]/students/[studentId]`

**Checkpoint**: User Story 1 is fully functional and delivers an independently testable MVP.

---

## Phase 4: User Story 2 - Teacher Hard Deletes an Attempt to Grant Retake (Priority: P2)

**Goal**: An educator can delete an attempt directly from the student review screen, permanently cascading removal of child answers/events, refunding the attempt slot so the student can retake the test, and automatically updating exam stats.

**Independent Test**: Click "Xóa lượt thi này" on an attempt, confirm in modal, verify attempt is hard-deleted from DB, student's used attempts counter decrements by 1, and exam stats update immediately without page reload.

### Tests for User Story 2 ⚠️

- [x] T015 [P] [US2] Unit test for `DeleteExamAttemptUseCase` verifying cascading deletion and non-existent attempt handling in `apps/api/test/test_manage_student_attempts.py`

### Implementation for User Story 2

- [x] T016 [US2] Implement `DeleteExamAttemptUseCase` executing atomic cascading deletion in `apps/api/app/application/use_cases/exams/delete_exam_attempt_uc.py`
- [x] T017 [US2] Add `DELETE /api/v1/exams/{exam_id}/attempts/{attempt_id}` endpoint with `EducatorUser` guard in `apps/api/app/presentation/api/routers/exams.py`
- [x] T018 [P] [US2] Add React Query mutation hook `useDeleteExamAttempt(examId, studentId)` with cache invalidation for `["exam-stats", examId]` and `["student-attempts", examId, studentId]` in `apps/web/features/exams/queries.ts`
- [x] T019 [US2] Implement delete confirmation modal dialog component in `apps/web/features/exams/components/exam-stats/student-attempts/delete-attempt-dialog.tsx`
- [x] T020 [US2] Integrate delete button and confirmation modal into attempt cards in `apps/web/app/(root)/teacher/stats/[id]/students/[studentId]/page.tsx`

**Checkpoint**: User Story 2 is complete. Teachers can delete attempts to grant retakes.

---

## Phase 5: User Story 3 - Role-Based Access Control & Action Auditing (Priority: P3)

**Goal**: Enforce strict RBAC so only educators/admins can access student answer sheets or delete attempts, and record structured audit logs for deletions.

**Independent Test**: Send GET and DELETE requests as a regular student or unauthenticated user and verify 403 Forbidden is returned.

### Implementation for User Story 3

- [x] T021 [US3] Add exam ownership/educator permission validation helper in `apps/api/app/application/use_cases/exams/delete_exam_attempt_uc.py` and `get_student_attempts_uc.py`
- [x] T022 [US3] Add structured audit logging (educator ID, student ID, deleted attempt ID, timestamp) on deletion in `apps/api/app/application/use_cases/exams/delete_exam_attempt_uc.py`
- [x] T023 [P] [US3] Add test case for 403 Forbidden rejection when non-educators call student attempt endpoints in `apps/api/test/test_manage_student_attempts.py`

**Checkpoint**: All user stories are implemented, verified, and secured.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Verification, quality gates, and end-to-end testing

- [x] T024 [P] Run backend pytest suite `uv run pytest apps/api/test/test_manage_student_attempts.py -v`
- [x] T025 [P] Run frontend TypeScript type-check `npm run --prefix apps/web type-check`
- [x] T026 Execute manual end-to-end verification following `quickstart.md` scenarios
