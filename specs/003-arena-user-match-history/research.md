# Phase 0 Research: Arena User Match History

**Feature**: Arena User Match History (`003-arena-user-match-history`)
**Status**: Completed

## 1. Research Objectives
- Determine the data access pattern for retrieving a specific user's game session history for a lesson.
- Determine the payload and security boundary: Ensure no question content or correct answer leaks to the client.
- Determine UI state flow inside `GameLeaderboardModal`: Switching between views (`LEADERBOARD` -> `MATCH_HISTORY` -> `MATCH_METRICS`) with breadcrumbs and back navigation.

## 2. Technical Findings & Decisions

### Decision 1: API Endpoint & Repository Query
- **Context**: In `apps/api`, game sessions are stored in `GameSessionEntity` with JSONB `snapshot` (containing `lesson_slug`, `gamification`, `questions`, and `answers`).
- **Decision**: Add an endpoint `GET /api/v1/game/{lesson_slug}/history/{user_id}`.
- **Repository Method**: Add `list_completed_by_user_and_lesson(user_id: int, lesson_slug: str, limit: int = 50)` in `IGameSessionRepository` and implement it in `GameSessionRepository`.
  - Filters: `user_id == user_id`, `status == GameSessionStatus.COMPLETED`, `tags_filter.contains([lesson_slug])`, ordered by `started_at.desc()`.
- **Alternatives Considered**:
  - Reusing `list_history(user_id)`: Fetches all sessions across all lessons and in-memory filtering. Rejected because DB-level filtering by tags/lesson and status is more performant and scalable.

### Decision 2: Payload Design & Privacy Boundary
- **Context**: The user explicitly confirmed: *Tuyệt đối không hiển thị câu hỏi và đáp án*.
- **Decision**:
  - The API response `UserMatchHistoryItemOut` will return summary & detailed metrics directly in the list, or allow full metrics display without question/option texts.
  - Fields per match:
    - `id`: UUID of session
    - `attempt_number`: Index of attempt (1, 2, 3...)
    - `started_at`: ISO timestamp
    - `completed_at`: ISO timestamp
    - `final_score`: Float
    - `raw_points`: Integer
    - `gold`: Integer
    - `total_time_response`: Float (seconds)
    - `correct_count`: Integer
    - `total_questions`: Integer
    - `accuracy_percentage`: Float (`(correct_count / total_questions) * 100`)
    - `max_streak`: Integer (computed from answer sequence or correct count)
    - `lives_left`: Integer
    - `is_perfect`: Boolean
- **Security Check**: No `QuestionSnapshot.content`, `options`, or `Question.options.is_correct` will be serialized in this endpoint.

### Decision 3: Frontend Modal In-Place View State Transition
- **Context**: `GameLeaderboardModal` in `apps/web/features/game/components/game-leaderboard-modal.tsx` currently renders leaderboard top 3 podium and list.
- **Decision**:
  - Define enum `type LeaderboardModalView = "LEADERBOARD" | "MATCH_HISTORY" | "MATCH_METRICS"`.
  - State:
    - `currentView: LeaderboardModalView` (default `"LEADERBOARD"`)
    - `selectedUser: { user_id: number, username: string | null, avatar_url: string | null } | null`
    - `selectedMatch: UserMatchMetrics | null`
  - In `LEADERBOARD` view: Keep Top 3 Podium as visual-only (no click). In the list below, add hover styling, pointer cursor, chevron icon, and `onClick={() => handleSelectUser(row)}`.
  - In `MATCH_HISTORY` view: Display breadcrumbs `[Bảng Vàng] > [Tên dũng sĩ]`, a header summary of the user, and a list of cards for each match attempt.
  - In `MATCH_METRICS` view: Display breadcrumbs `[Bảng Vàng] > [Tên dũng sĩ] > [Lượt thi #N]`, a card grid showing detailed statistics (Score, Gold, Total Time, Accuracy %, Correct/Incorrect count, Streak, Lives left).
  - Back navigation: Breadcrumb clicks or Back button resets `currentView` gracefully with framer-motion transitions (`AnimatePresence`).

## 3. Alternatives Evaluated & Rejected
- **Nested Modal / Popup**: Rejected by user during clarification because it creates UI clutter, nested scrollbars, and overlay stacking issues on mobile.
- **Slide-over Drawer**: Rejected in favor of in-modal view switching to maintain focus inside the modal frame.
