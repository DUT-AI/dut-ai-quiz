---
description: "Task list for Arena User Match History feature implementation"
---

# Tasks: Arena User Match History (Lịch Sử Thi Đấu Dũng Sĩ)

**Input**: Design documents from `specs/003-arena-user-match-history/`
**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/get-user-match-history.md](contracts/get-user-match-history.md), [quickstart.md](quickstart.md)

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Parallelizable (different files, no overlapping dependencies)
- **[Story]**: User story mapping (`US1`, `US2`, `US3`)
- File paths are exact project-relative paths

---

## Phase 1: Setup & Foundational (Data & Backend Infrastructure)

**Purpose**: Core backend schemas, repository methods, and contract setup required before UI integration.

- [X] T001 [P] Define backend Pydantic schemas `UserMatchHistoryItem` and `UserMatchHistoryResponse` in `apps/api/app/presentation/schemas/game.py` quoting exact contract fields (no question or answer text).
- [X] T002 [P] Add `list_completed_by_user_and_lesson(user_id: int, lesson_slug: str, limit: int = 50)` method signature to interface `apps/api/app/domain/interfaces/game_session_repo.py`.
- [X] T003 Implement `list_completed_by_user_and_lesson` in `apps/api/app/infrastructure/repositories/game_sessions.py` querying completed `game_sessions` by `user_id` and `tags_filter` ordered by `started_at` descending.
- [X] T004 Implement `GetUserMatchHistoryUseCase` in `apps/api/app/application/use_cases/game/get_user_match_history.py` to extract snapshot gamification stats, calculate `accuracy_percentage`, `max_streak`, and aggregate user metadata without question content.
- [X] T005 Register `GetUserMatchHistoryUseCase` in DI provider and add route `GET /{lesson_slug}/history/{user_id}` in `apps/api/app/presentation/api/routers/game.py`.
- [X] T006 [P] Add unit test for `GetUserMatchHistoryUseCase` in `apps/api/test/test_get_user_match_history.py` validating metrics calculations, empty states, and ensuring question texts are never returned.
- [X] T007 [P] Define Zod schemas and TypeScript types (`UserMatchHistoryItemSchema`, `UserMatchHistoryResponseSchema`) in `apps/web/features/game/types.ts`.
- [X] T008 [P] Add TanStack Query hook `useUserMatchHistory(lessonSlug: string, userId: number | null)` in `apps/web/features/game/queries.ts`.

**Checkpoint**: Backend endpoint `GET /api/v1/game/{lesson_slug}/history/{user_id}` and Frontend query hooks ready.

---

## Phase 2: User Story 1 - Xem Danh Sách Tổng Quan Lịch Sử Lượt Thi (Priority: P1) 🎯 MVP

**Goal**: Cho phép người dùng click vào một dũng sĩ bất kỳ trong danh sách xếp hạng bên dưới Bảng Vàng để chuyển sang xem danh sách các lượt thi đấu của người đó trong bài học hiện tại (Bục Top 3 podium giữ nguyên không gán click).

**Independent Test**: Mở modal Bảng Vàng Dũng Sĩ, click vào hàng một người dùng bất kỳ -> Modal chuyển sang hiển thị danh sách tổng quan các lượt thi với số thứ tự, điểm, vàng, thời gian làm bài và nút quay lại.

### Implementation for User Story 1
- [X] T009 [US1] Create component `GameUserMatchHistoryView` in `apps/web/features/game/components/game-user-match-history-view.tsx` rendering user avatar/name summary, attempt count, and list of match summary cards (attempt #, date/time, score, gold, time response, and right chevron).
- [X] T010 [US1] Add state management `currentView` (`"LEADERBOARD" | "MATCH_HISTORY" | "MATCH_METRICS"`) and `selectedUser` inside `apps/web/features/game/components/game-leaderboard-modal.tsx`.
- [X] T011 [US1] Update leaderboard table items in `apps/web/features/game/components/game-leaderboard-modal.tsx` to add hover states, cursor-pointer, chevron indicators, and click handler setting `selectedUser` and switching to `"MATCH_HISTORY"`. Confirm Top 3 podium elements remain non-clickable.
- [X] T012 [US1] Integrate `GameUserMatchHistoryView` into `apps/web/features/game/components/game-leaderboard-modal.tsx` with smooth view transitions using `AnimatePresence`.

**Checkpoint**: User Story 1 MVP fully functional and testable independently.

---

## Phase 3: User Story 2 - Xem Chỉ Số Thống Kê Chi Tiết Của Lượt Thi (Priority: P2)

**Goal**: Cho phép người dùng bấm vào một lượt thi cụ thể trong danh sách để xem chi tiết các chỉ số thống kê chuyên sâu (điểm, vàng, thời gian, số câu đúng/sai, độ chính xác %, max streak), tuyệt đối không để lộ văn bản câu hỏi và đáp án.

**Independent Test**: Từ danh sách lượt thi của dũng sĩ (Tầng 2), click vào một thẻ lượt thi -> Modal chuyển sang view chi tiết hiển thị thẻ thống kê chuyên sâu các chỉ số hiệu suất.

### Implementation for User Story 2
- [X] T013 [US2] Create component `GameUserMatchMetricsView` in `apps/web/features/game/components/game-user-match-metrics-view.tsx` displaying detailed stats cards (Score, Gold, Total Time, Accuracy %, Correct/Incorrect ratio, Max Streak, Lives left, Completion status).
- [X] T014 [US2] Add `selectedMatch` state in `apps/web/features/game/components/game-leaderboard-modal.tsx` and wire click callback from `GameUserMatchHistoryView` to transition to `"MATCH_METRICS"`.
- [X] T015 [US2] Integrate `GameUserMatchMetricsView` into `apps/web/features/game/components/game-leaderboard-modal.tsx` with `AnimatePresence` transition.

**Checkpoint**: User Story 2 fully functional, connecting Tầng 2 sang Tầng 3 trơn tru.

---

## Phase 4: User Story 3 - Điều Hướng Nội Bộ Modal & Breadcrumb Đa Cấp (Priority: P3)

**Goal**: Đảm bảo điều hướng nội bộ modal liền mạch với thanh Breadcrumb đa cấp (`Bảng Vàng` > `[Tên dũng sĩ]` > `Lượt thi #[N]`) và nút Back quay lại từng tầng.

**Independent Test**: Kiểm tra điều hướng đa cấp: bấm trực tiếp vào bất kỳ node nào trên breadcrumb hoặc bấm nút Back để quay về tầng trước; bấm nút X đóng modal ở bất kỳ tầng nào đóng modal an toàn.

### Implementation for User Story 3
- [X] T016 [US3] Implement dynamic modal header with breadcrumb navigation (`Bảng Vàng` -> `[Tên dũng sĩ]` -> `Lượt thi #[N]`) and Back button in `apps/web/features/game/components/game-leaderboard-modal.tsx`.
- [X] T017 [US3] Ensure modal close button (X) and backdrop click cleanly reset all view state (`currentView = "LEADERBOARD"`, `selectedUser = null`, `selectedMatch = null`) when closed.
- [X] T018 [P] [US3] Export new components from `apps/web/features/game/components/index.ts`.

---

## Phase 5: Polish & Validation

**Purpose**: Verification against quality criteria, responsiveness, and edge cases.

- [X] T019 [P] Handle loading skeletons and empty states ("Chưa có lượt thi đấu nào") in `GameUserMatchHistoryView`.
- [X] T020 [P] Test mobile responsive layout for both history list and metrics grid on small viewports (<640px).
- [X] T021 Execute validation scenarios from `specs/003-arena-user-match-history/quickstart.md`.

---

## Dependencies & Execution Order

### Phase Dependencies
- **Phase 1 (Setup & Foundational)**: Can start immediately. Blocks all User Stories.
- **Phase 2 (User Story 1 - MVP)**: Depends on Phase 1 completion.
- **Phase 3 (User Story 2)**: Depends on Phase 2 (uses selected user and match item).
- **Phase 4 (User Story 3)**: Depends on Phase 2 & 3 (connects breadcrumb navigation across all views).
- **Phase 5 (Polish)**: Runs after User Stories 1-3.

### Parallel Opportunities
- In Phase 1: T001, T002, T006, T007, T008 can be developed in parallel.
- In Phase 5: T019, T020 can run in parallel.

---

## Implementation Strategy: MVP First

1. **Sprint 1 (MVP)**: Hoàn thành Phase 1 (Backend API & Schemas) + Phase 2 (User Story 1 - Danh sách lượt thi của dũng sĩ). Có thể chạy thử và demo ngay.
2. **Sprint 2**: Hoàn thành Phase 3 (User Story 2 - Chi tiết chỉ số lượt thi) + Phase 4 (Breadcrumb & Điều hướng) + Phase 5 (Polish & Responsive).
