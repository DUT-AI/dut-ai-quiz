---
description: "Task list for Exam Attempt Lifecycle, Scoring & Anti-Cheat Overhaul"
---

# Tasks: Exam Attempt Lifecycle, Scoring & Anti-Cheat Overhaul

**Input**: Design documents from `/specs/014-exam-attempt-lifecycle/`  
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/attempt-api.yaml`, `quickstart.md`

## Organization

Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4, US5)
- Include exact file paths in descriptions

---

## Phase 1: Setup & Contract Synchronization

**Purpose**: Verify environment, in-memory models, and regenerate contract types.

- [x] T001 Verify database is clean without schema migration (`make alembic-current`)
- [x] T002 [P] Update domain `AttemptEntity` with in-memory `correct_count` and `total_questions` fields in `apps/api/app/domain/entities/attempt.py`
- [x] T003 [P] Update `AttemptOut` and `ShuffledQuestionOut` in `apps/api/app/presentation/schemas/attempts.py`
- [x] T004 Run `make generate-api` to synchronize TypeScript contracts into `apps/web/types/api.generated.d.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core repository and interface contracts required across user stories.

- [x] T005 [P] Add `get_by_ids(question_ids: list[UUID])` to `IQuestionRepository` in `apps/api/app/domain/interfaces/question_repo.py`
- [x] T006 [P] Implement `get_by_ids` bulk retrieval in `apps/api/app/infrastructure/repositories/questions.py`
- [x] T007 [P] Add `get_active_for_user_exam(user_id: int, exam_id: UUID)` to `IAttemptRepository` in `apps/api/app/domain/interfaces/attempt_repo.py`
- [x] T008 [P] Implement `get_active_for_user_exam` in `apps/api/app/infrastructure/repositories/attempts.py`
- [x] T009 Fix `ExamEntity.can_access(user_id=None)` for restricted exams in `apps/api/app/domain/entities/exam.py`

**Checkpoint**: Foundation ready - user story implementation can proceed.

---

## Phase 3: User Story 1 - Accurate Dual Scoring & Transparent Attempt Review (Priority: P1) 🎯 MVP

**Goal**: Display official 10-point scale score and raw correct count with accurate percentages, and reconstruct the student's exact shuffled question sequence upon review.

### Tests for User Story 1
- [x] T010 [P] [US1] Unit test for in-memory score and correct count calculation in `apps/api/test/test_attempt_scoring.py`
- [x] T011 [P] [US1] Unit test for review snapshot reconstruction in `apps/api/test/test_attempt_review_shuffle.py`

### Implementation for User Story 1
- [x] T012 [US1] Update `AttemptEntity.score_attempt()` to compute `score`, `correct_count`, and `total_questions` in `apps/api/app/domain/entities/attempt.py`
- [x] T013 [US1] Update `ReviewAttemptUseCase.execute()` to compute in-memory counts for legacy attempts in `apps/api/app/application/use_cases/attempts/review_attempt_uc.py`
- [x] T014 [US1] Refactor `ReviewAttemptUseCase.execute()` to reconstruct questions using `att.shuffle_snapshot.reconstruct_presentation()` via `_question_repo.get_by_ids()`
- [x] T015 [US1] Update Zod schemas in `apps/web/features/attempts/types.ts` (`AttemptOutSchema`, nullable `is_correct`)
- [x] T016 [US1] Update `apps/web/app/(root)/history/[attemptId]/review/page.tsx` to display `{score.toFixed(1)} / 10 ĐIỂM`, animated `scorePercentage`, and badge `{correct_count}/{total_questions} câu`

**Checkpoint**: User Story 1 is fully functional and review displays both 10-point scale and raw counts accurately.

---

## Phase 4: User Story 2 - Enforcement of Max Attempts & Resuming In-Progress Attempts (Priority: P1)

**Goal**: Prevent exceeding `max_attempts`, provide an active attempt detection endpoint, and allow students to resume or restart on the exam page.

### Tests for User Story 2
- [x] T017 [P] [US2] Unit test for `StartAttemptUseCase` verifying `MaxAttemptsReachedException` in `apps/api/test/test_attempt_max_quota.py`
- [x] T018 [P] [US2] Unit test for resume active attempt vs restart action in `apps/api/test/test_attempt_resume.py`

### Implementation for User Story 2
- [x] T019 [US2] Add `GET /api/v1/exams/{exam_id}/my-active-attempt` route in `apps/api/app/presentation/api/routers/attempts.py`
- [x] T020 [US2] Enforce `count_completed_for_user_exam >= exam.max_attempts` check in `apps/api/app/application/use_cases/attempts/start_attempt_use_case.py`
- [x] T021 [US2] Support resume (`action="start"`) and restart (`action="restart"`, marking old attempt `ABANDONED`) in `StartAttemptUseCase`
- [x] T022 [P] [US2] Add `useActiveAttempt(examId)` query and update `useStartAttempt` in `apps/web/features/attempts/queries.ts`
- [x] T023 [US2] Update `/exams/[id]/page.tsx` to render active attempt banner with "Tiếp tục làm bài (Resume)" and "Làm lại từ đầu" buttons, and disable start when `max_attempts` exhausted

**Checkpoint**: User Story 2 prevents exceeding attempt quotas and seamlessly resumes in-progress sessions.

---

## Phase 5: User Story 3 - Resilient Anti-Cheat with 2.0s Mouse-Leave Grace Window (Priority: P2)

**Goal**: Eliminate false-positive auto-submissions by introducing a 2-second timeout on mouse leaves, a 3-second stabilization cooldown on fullscreen return, and macOS shortcut interception.

### Implementation for User Story 3
- [x] T024 [US3] Implement 2000ms grace window timer for `mouseleave` and clear on `mouseenter` in `apps/web/hooks/use-anti-cheat.ts`
- [x] T025 [US3] Add 3000ms stabilization cooldown upon modal dismissal before re-arming heartbeat and fullscreen checks in `apps/web/hooks/use-anti-cheat.ts`
- [x] T026 [US3] Add macOS `e.metaKey` modifier checks to keyboard event listeners in `apps/web/hooks/use-anti-cheat.ts`
- [x] T027 [US3] Ensure `mouse_leave` in backend `RecordFocusEventUseCase` respects client event throttle and limits

**Checkpoint**: Incidental mouse movements outside window boundaries do not trigger strikes if returned within 2 seconds.

---

## Phase 6: User Story 4 - Strict Expiration Window with 60s Grace Period (Priority: P2)

**Goal**: Reject late answer patches (+10s cutoff) and provide a 60-second grace window for submit requests, marking unsubmitted expired attempts as `TIMED_OUT`.

### Tests for User Story 4
- [x] T028 [P] [US4] Unit test for `PatchAttemptAnswersUseCase` expiration rejection in `apps/api/test/test_attempt_expiration.py`
- [x] T029 [P] [US4] Unit test for `SubmitAttemptUseCase` 60s grace period and `TIMED_OUT` status in `apps/api/test/test_attempt_submission_grace.py`

### Implementation for User Story 4
- [x] T030 [US4] Add `now_ict() > att.expires_at + timedelta(seconds=10)` check in `apps/api/app/application/use_cases/attempts/attempt_use_case.py` (`PatchAttemptAnswersUseCase`)
- [x] T031 [US4] Implement 60-second submission grace period in `apps/api/app/application/use_cases/attempts/submit_attempt_use_case.py`
- [x] T032 [US4] Include `server_time` in `GET /attempts/{id}` and compensate for client clock skew in `apps/web/app/(root)/exams/[id]/attempt/[attemptId]/page.tsx`

**Checkpoint**: Answer tampering after deadline is completely prevented while network latency at submission is tolerated.

---

## Phase 7: User Story 5 - Clean Code & Modular Exam UI Decomposition (Priority: P3)

**Goal**: Eliminate N+1 queries during attempt loading and decompose the 617-line god-component in `apps/web` into cohesive subcomponents and hooks.

### Implementation for User Story 5
- [x] T033 [US5] Refactor `GetAttemptUseCase` in `apps/api/app/application/use_cases/attempts/attempt_use_case.py` to use `_question_repo.get_by_ids(ids)` instead of N loops
- [x] T034 [P] [US5] Extract `useExamTimer` hook (countdown + clock skew sync) to `apps/web/features/attempts/hooks/useExamTimer.ts`
- [x] T035 [P] [US5] Extract `useExamSession` hook (answer state, debounced auto-save, submit) to `apps/web/features/attempts/hooks/useExamSession.ts`
- [x] T036 [P] [US5] Create `ExamHeader.tsx` component in `apps/web/features/attempts/components/ExamHeader.tsx`
- [x] T037 [P] [US5] Create `QuestionCard.tsx` component in `apps/web/features/attempts/components/QuestionCard.tsx`
- [x] T038 [P] [US5] Create `QuestionNavigator.tsx` palette in `apps/web/features/attempts/components/QuestionNavigator.tsx`
- [x] T039 [P] [US5] Create `SubmitConfirmationModal.tsx` in `apps/web/features/attempts/components/SubmitConfirmationModal.tsx`
- [x] T040 [US5] Refactor `apps/web/app/(root)/exams/[id]/attempt/[attemptId]/page.tsx` to compose extracted components (< 150 lines)

**Checkpoint**: All components are under 150 lines, highly readable, and cleanly separated.

---

## Phase 8: Polish & Verification

**Purpose**: Cross-cutting quality checks and test suite validation.

- [x] T041 Run full backend test suite: `cd apps/api && uv run pytest`
- [x] T042 Run full backend and worker linter: `make api-lint`
- [x] T043 Run frontend type checking: `make type-check`
- [x] T044 Run frontend linter: `cd apps/web && npm run lint`
- [x] T045 Execute quickstart verification scenarios from `specs/014-exam-attempt-lifecycle/quickstart.md`
