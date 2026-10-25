# API Contract Specification: Game Sessions

**Feature**: `008-game-session-schema-normalization`  
**Date**: 2026-10-25  
**Spec**: [spec.md](file:///Users/nguyenhuynh/Documents/projects/dut-ai-quiz/specs/008-game-session-schema-normalization/spec.md)

---

## 1. Overview
The database schema normalization changes internal table storage (`game_sessions`), removing `tags_filter` and `snapshot`. 
To preserve client compatibility with `apps/web`, all FastAPI endpoint schemas retain their existing response shapes.

---

## 2. Endpoint Contracts

### `POST /api/v1/game/sessions` (Start Session)
- **Request Body**:
  ```json
  {
    "lesson_slug": "yolo"
  }
  ```
- **Response (`GameSessionStartOut`)**:
  ```json
  {
    "session_id": "02a1c490-8fe6-4060-ad86-9f31a0469c16",
    "snapshot": {
      "lesson_slug": "yolo",
      "questions": [
        {
          "id": "e6a1d60b-cd39-422e-9879-0f5a0d769458",
          "content": "Câu 5: Việc đánh giá bài toán Object Detection...",
          "options": [
            { "id": "80339a14", "text": "A. 0.349." },
            { "id": "ecb24ba3", "text": "D. 0.789." }
          ],
          "time_limit": 60,
          "time_response": 0.0,
          "tier": 1,
          "is_boss": false
        }
      ],
      "answers": {},
      "gamification": {
        "lives": 3,
        "gold": 0,
        "points": 0,
        "current_tier": 1,
        "last_question_index": 0,
        "boss_hp": 0,
        "shield_used_in_tier": {},
        "total_time_response": 0.0,
        "correct_count": 0,
        "final_score": 0.0,
        "attempt_count": 1
      }
    }
  }
  ```

### `GET /api/v1/game/sessions/active?lesson_slug={slug}`
- **Query Params**: `lesson_slug=yolo`
- **Response**: Same as `GameSessionStartOut` (hydrated active turn).

### `GET /api/v1/game/sessions/{session_id}`
- **Response (`GameSessionDetailOut`)**:
  ```json
  {
    "id": "02a1c490-8fe6-4060-ad86-9f31a0469c16",
    "user_id": 1,
    "started_at": "2026-10-25T15:00:00",
    "completed_at": null,
    "status": "IN_PROGRESS",
    "snapshot": { ... },
    "tags_filter": ["yolo"],
    "question_limit": 10
  }
  ```
  *Note: `tags_filter` in DTO is automatically populated as `[session.lesson_slug]` to ensure zero breaking changes for existing web consumers.*

### `GET /api/v1/game/leaderboard?lesson_slug={slug}&limit=100`
- **Query Execution**: Uses high-speed B-Tree index scan on `(lesson_slug, final_score, gold_earned, total_time_response)`.
- **Response**: `list[GameLeaderboardRowOut]`.
