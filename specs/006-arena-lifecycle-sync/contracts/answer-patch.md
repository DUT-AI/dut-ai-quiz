# API Contracts: Arena Answer Submission & Synchronization

**Feature**: `006-arena-lifecycle-sync`
**Date**: 2026-10-24

## 1. PATCH `/api/v1/game/sessions/{session_id}/answers`

### Request Body
```json
{
  "question_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "option_id": "opt-1",
  "time_response": 4.5,
  "activate_shield": false,
  "activate_double_points": false
}
```

### Success Response (200 OK)
```json
{
  "is_correct": true,
  "points_gained": 100,
  "coins_gained": 20,
  "updated_gamification": {
    "lives": 3,
    "gold": 20,
    "points": 100,
    "current_tier": 1,
    "last_question_index": 1,
    "boss_hp": 0,
    "shield_used_in_tier": {},
    "current_question_started_at": null,
    "total_time_response": 4.5,
    "correct_count": 1,
    "final_score": 100.0,
    "attempt_count": 1
  },
  "is_game_over": false,
  "correct_option_id": "opt-1"
}
```

### Idempotent Behavior (200 OK)
When `question_id` has already been recorded in `snapshot.answers`:
- Backend returns `points_gained: 0`, `coins_gained: 0`, the recorded correctness status, and the current `updated_gamification` state.
- Does NOT throw `DomainValidationException("Question ID does not match current question index")`.
