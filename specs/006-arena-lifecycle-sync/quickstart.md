# Quickstart Validation: Arena Game Lifecycle and Turn Synchronization

**Feature**: `006-arena-lifecycle-sync`
**Date**: 2026-10-24

## 1. Automated Backend Verification
Run backend pytest to ensure timer handling, answer submissions, and idempotent responses pass:

```bash
cd apps/api
pytest test/test_game_timer_verification.py -v
```

Expected result: 4 passed.

## 2. Frontend Type & Build Verification
Verify TypeScript compile integrity without type issues:

```bash
cd apps/web
npx tsc --noEmit --incremental false
```

Expected result: 0 errors.

## 3. End-to-End User Gameplay Scenario
1. Start an Arena game for any lesson (e.g. `/lessons/numpy`).
2. Rapidly double-click on an answer option.
   - **Verification**: No error toast `"Question ID does not match current question index"`. Exactly one answer feedback triggers.
3. Allow the circular timer to run down to 0 on a question.
   - **Verification**: Timeout toast appears once, answer records as incorrect, no duplicate submit errors.
4. Click "TIẾP TỤC HÀNH TRÌNH".
   - **Verification**: Smooth transition to Question 2, timer resets, question content and options render properly.
