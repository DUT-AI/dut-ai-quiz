# Quickstart: Clean Game Session API Contract & Dead Code Elimination

**Feature Branch**: `009-clean-game-contract-dead-code`  
**Date**: 2026-10-25  
**Spec**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md)

---

## 1. Prerequisites

- Python 3.12+ with `uv`
- Node.js 18+ with `npm`
- PostgreSQL running locally or in Docker with migrations up to date (`make migrate`)

---

## 2. Validation Scenarios

### Scenario 1: Start & Resume Session with Clean Contract
1. Send `POST /game/sessions` with `{"lesson_slug": "math-101"}`.
2. Verify response matches `GameSessionOut`:
   - Top-level fields: `id`, `user_id`, `lesson_slug`, `status: "IN_PROGRESS"`, `current_question_index: 0`.
   - `current_question`: Hydrated with `content`, `options`, `time_limit`, `tier`, `is_boss`.
   - `gamification`: Contains `lives: 3`, `gold: 0`, `points: 0`, `current_tier: 1`.
   - **Crucial**: No `snapshot` key in response!
3. Send `GET /game/sessions/active?lesson_slug=math-101`.
4. Verify response identical in shape to `POST /game/sessions`.

### Scenario 2: Turn Progression without Payload Bloat
1. Send `PATCH /game/sessions/{id}/answers` with:
   ```json
   {
     "question_id": "<current_q_uuid>",
     "selected_option_id": "<option_uuid>",
     "time_response": 3.5
   }
   ```
2. Verify response matches `GamificationAnswerResultOut`:
   - Contains `is_correct`, `points_gained`, `coins_gained`, `updated_gamification`, `next_question`.
   - **Crucial**: No `snapshot` key in response!

### Scenario 3: Match History Query Execution
1. Send `GET /game/history`.
2. Verify response is `list[GameSessionOut]`:
   - Each item contains `final_score`, `gold_earned` (inside `gamification`), `lesson_slug`, `completed_at`, `status`.
   - **Crucial**: No `tags_filter` and no `snapshot` keys present.

---

## 3. Automated Verification Commands

Run from the repository root:

```bash
# 1. Verify Backend Unit & Integration Tests
uv run pytest apps/api/test/

# 2. Synchronize Frontend API Types from FastAPI OpenAPI
make generate-api

# 3. Verify Frontend TypeScript Compilation
npm --prefix apps/web run type-check

# 4. Verify Frontend Linting
npm --prefix apps/web run lint

# 5. Full Pre-Commit Quality Gate
make check
```

---

## 4. Expected Outcomes

- `148+ passed` tests in `pytest`.
- `api.generated.d.ts` reflects `GameSessionOut` with zero references to `GameSessionStartOut` or `GameSessionSnapshotOut`.
- Frontend builds and passes type checks with zero errors.
- `make check` outputs `✅ ALL CHECKS PASSED`.
