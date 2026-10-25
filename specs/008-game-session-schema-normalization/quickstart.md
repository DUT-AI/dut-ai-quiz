# Quickstart Validation Guide: Game Session Schema Normalization

**Feature**: `008-game-session-schema-normalization`  
**Date**: 2026-10-25  
**Spec**: [spec.md](file:///Users/nguyenhuynh/Documents/projects/dut-ai-quiz/specs/008-game-session-schema-normalization/spec.md)

---

## 1. Prerequisites
- PostgreSQL running on local/dev database.
- Environment variables configured in `.env`.

---

## 2. Migration Execution
Run the Alembic migration to apply the normalized schema and backfill historical data:

```bash
cd apps/api
uv run alembic upgrade head
```

### Verification Query (Check Schema & Historical Integrity):
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'game_sessions';
-- Verify tags_filter and snapshot are ABSENT
-- Verify lesson_slug, final_score, gold_earned, question_sequence, gamification_state are PRESENT
```

Check sample migrated rows:
```sql
SELECT id, lesson_slug, final_score, gold_earned, total_time_response, attempt_count,
       jsonb_array_length(question_sequence) as question_count,
       gamification_state->>'current_tier' as tier
FROM game_sessions
LIMIT 5;
```

---

## 3. Query Performance & Index Verification
Run `EXPLAIN ANALYZE` on leaderboard query to verify index scan usage:

```sql
EXPLAIN ANALYZE
SELECT id, user_id, final_score, gold_earned, total_time_response, attempt_count
FROM game_sessions
WHERE status = 'COMPLETED'
  AND lesson_slug = 'yolo'
  AND question_limit > 0
ORDER BY final_score DESC, gold_earned DESC, total_time_response ASC, attempt_count ASC
LIMIT 100;
-- Expected: Index Scan using idx_game_sessions_leaderboard (Execution time < 15ms)
```

---

## 4. Automated Testing
Run the backend test suite covering the normalized models and use cases:

```bash
uv run pytest apps/api/test/test_game_review.py apps/api/test/test_game_concurrency.py apps/api/test/test_game_storage_refactor.py apps/api/test/test_game_unit.py apps/api/test/test_game_timer_verification.py apps/api/test/test_gamification_state.py -v
```

Run pre-commit quality checks:
```bash
make check
```
Expected: 100% PASS across conflict markers, Ruff lint & format, ESLint, and TypeScript.
