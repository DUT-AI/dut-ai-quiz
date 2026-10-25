# Quickstart & Verification Guide: Game Session Storage Refactor

**Branch**: `007-game-session-storage-refactor` | **Date**: 2026-10-25 | **Feature**: [spec.md](./spec.md)

This guide documents the verification workflows, test commands, and end-to-end scenarios to validate the game session storage refactoring.

---

## 1. Prerequisites & Environment Setup

Ensure the PostgreSQL database and backend service dependencies are active:

```bash
# Verify backend virtual environment and tools
uv run python --version
```

---

## 2. Database Migration & Schema Verification

Run Alembic migrations to apply the `game_session_answers` table and backfill historical data:

```bash
# Apply pending migration
make migrate
# Or directly via alembic:
uv run alembic upgrade head
```

Verify tables in PostgreSQL:

```sql
-- Confirm table existence and indexes
\d game_session_answers

-- Verify unique constraint exists
SELECT conname, contype 
FROM pg_constraint 
WHERE conrelid = 'game_session_answers'::regclass;
```

---

## 3. Automated Test Suite

Execute the dedicated pytest test cases covering append-only answer logging, concurrency protection, and turn hydration:

```bash
# Run unit and use-case verification tests
uv run pytest test/test_game_session_storage.py test/test_game_unit.py -v
```

### Key Test Scenarios Checked:
1. **Turn Progression Test**: Submitting an answer writes 1 row to `game_session_answers`, increments `last_question_index`, and returns the next hydrated question.
2. **Idempotency & Race Condition Test**: Two simultaneous answer submissions with the same `(session_id, question_id)` fail safely with conflict/integrity rejection on the second attempt.
3. **Turn Hydration Test**: Loading an active session returns only the current question's text and options, never leaking future questions.
4. **Completion Aggregation Test**: Answering the last question computes `final_score` and `correct_count` from `game_session_answers` and marks the session `COMPLETED`.

---

## 4. Frontend Contract Verification

Synchronize OpenAPI contracts with the frontend and verify TypeScript types:

```bash
# 1. Regenerate TypeScript canonical contracts from FastAPI
make generate-api

# 2. Verify Next.js compilation and type safety (Must have 0 errors)
cd apps/web && npm run type-check
```

---

## 5. End-to-End API Flow (Manual Curl Scenario)

```bash
# 1. Start a game session
SESSION_RESP=$(curl -s -X POST "http://localhost:8000/api/v1/game/sessions" \
  -H "Authorization: Bearer $TEST_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"lesson_slug": "ai-ethics"}')

SESSION_ID=$(echo $SESSION_RESP | jq -r '.session_id')
FIRST_Q_ID=$(echo $SESSION_RESP | jq -r '.current_question.id')
FIRST_OPT_ID=$(echo $SESSION_RESP | jq -r '.current_question.options[0].id')

# 2. Submit answer to question 0
curl -s -X PATCH "http://localhost:8000/api/v1/game/sessions/$SESSION_ID/answers" \
  -H "Authorization: Bearer $TEST_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"question_id\": \"$FIRST_Q_ID\", \"option_id\": \"$FIRST_OPT_ID\", \"time_response\": 5.2}"

# 3. Verify duplicate submission is rejected (Idempotency check)
curl -s -X PATCH "http://localhost:8000/api/v1/game/sessions/$SESSION_ID/answers" \
  -H "Authorization: Bearer $TEST_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"question_id\": \"$FIRST_Q_ID\", \"option_id\": \"$FIRST_OPT_ID\", \"time_response\": 5.2}"
# Expect: 400/409 Conflict

# 4. Fetch Match Review after completion
curl -s -X GET "http://localhost:8000/api/v1/game/sessions/$SESSION_ID/review" \
  -H "Authorization: Bearer $TEST_TOKEN"
```
