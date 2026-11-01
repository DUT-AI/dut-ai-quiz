# Tasks: Lesson Deletion & Question Relocation (Quản lý câu hỏi khi xóa bài học)

**Input**: Design documents from `/specs/012-cascade-delete-lesson/`
**Prerequisites**: plan.md (required), spec.md (required for user stories)

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup & Database Schema

**Purpose**: Update database foreign key constraint and ORM models to prevent ForeignKeyViolationError

- [x] T001 Create Alembic migration script to alter `questions_lesson_id_fkey` constraint to `ON DELETE SET NULL` in `apps/api/alembic/versions/`
- [x] T002 Update `Question` SQLAlchemy model foreign key definition in `apps/api/app/infrastructure/persistence/models/question.py` to use `ondelete="SET NULL"`

---

## Phase 2: Foundational (Backend Schemas & Repository Support)

**Purpose**: Core backend data structures and repository queries required by all deletion actions

- [x] T003 Define `LessonDeleteAction` enum and `LessonDeleteQuery` request schema in `apps/api/app/presentation/schemas/lessons.py`
- [x] T004 Add repository helper methods to reassign questions, count questions in lesson, and check if questions are referenced in exams in `apps/api/app/infrastructure/repositories/lessons.py` and `apps/api/app/infrastructure/repositories/questions.py`
- [x] T005 Update `DELETE /api/v1/lessons/{lesson_id}` endpoint in `apps/api/app/presentation/api/routers/lessons.py` to accept query params `action` and `reassign_to_lesson_id`

---

## Phase 3: User Story 1 - Reassign questions to another lesson (Priority: P1) 🎯 MVP

**Goal**: Allow teachers to relocate questions from a deleted lesson to an existing target lesson so learning progress and categorizations are preserved.

**Independent Test**: Delete a lesson with `action="reassign"` and a valid `reassign_to_lesson_id`. Verify questions belong to target lesson and lesson is deleted.

- [x] T006 [US1] Implement reassign logic in `apps/api/app/application/use_cases/lessons/delete_lesson_uc.py`
- [x] T007 [P] [US1] Add test for deleting lesson with question reassignment in `apps/api/test/test_delete_lesson.py`

---

## Phase 4: User Story 2 - Unassign questions to Uncategorized pool (Priority: P1)

**Goal**: Keep questions intact and safe in the question bank and existing exams, detaching them from the deleted lesson into an unclassified state.

**Independent Test**: Delete a lesson with `action="unassign"`. Verify questions now have `lesson_id = null`, questions in `exam_questions` remain linked, and lesson is deleted without error.

- [x] T008 [US2] Implement unassign logic in `apps/api/app/application/use_cases/lessons/delete_lesson_uc.py`
- [x] T009 [P] [US2] Add test for deleting lesson with questions used in exams in `apps/api/test/test_delete_lesson.py`

---

## Phase 5: User Story 3 - Delete questions with safety guard (Priority: P2)

**Goal**: Allow deleting questions alongside the lesson only if none of the questions are referenced in any exams, returning a business-friendly error if blocked.

**Independent Test**: Delete a lesson with `action="delete"`. If questions are in exams, verify 400 error with descriptive Vietnamese message. If not in exams, questions are deleted with lesson.

- [x] T010 [US3] Implement exam constraint check and delete logic in `apps/api/app/application/use_cases/lessons/delete_lesson_uc.py`
- [x] T011 [P] [US3] Add test for blocked deletion when questions are in exams in `apps/api/test/test_delete_lesson.py`

---

## Phase 6: User Story 4 - Dedicated UI Delete Modal (Priority: P1)

**Goal**: Provide teachers with a clean, friendly modal (`DeleteLessonModal`) offering the 3 choices in pedagogical terms (no technical terms like `lesson_id = null`), showing question count and target lesson selection.

**Independent Test**: Open the teacher lessons page, click Delete on a lesson with questions, observe question count, select options, and trigger deletion successfully.

- [x] T012 [US4] Update TanStack Query mutation `useDeleteLesson` in `apps/web/features/lessons/queries.ts` to support `action` and `reassign_to_lesson_id`
- [x] T013 [US4] Create `DeleteLessonModal` component with pedagogical copy and lesson selector in `apps/web/features/lessons/components/delete-lesson-modal.tsx`
- [x] T014 [US4] Integrate `DeleteLessonModal` into `apps/web/app/(root)/teacher/lessons/page.tsx` replacing generic confirm dialog

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Quality verification, linting, and regression testing across API and Web apps

- [x] T015 Run automated backend tests `pytest apps/api/test/test_delete_lesson.py`
- [x] T016 Run full project validation with `make check`
