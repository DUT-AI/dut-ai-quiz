# Quickstart & Verification Guide: Extensible Game Item System

**Feature**: `010-game-item-system`  
**Date**: 2026-10-25  

## 1. Overview & Prerequisites

This guide defines end-to-end verification scenarios for testing the extensible item strategy system in the DUT-AI Quiz arena backend.

### Prerequisites
- Python 3.12+ with `uv` installed
- Node.js 18+ with `npm` installed
- Backend dependencies installed: `uv sync`

---

## 2. Automated Test Verification

Run the full pytest suite to verify all existing and new item strategy tests:

```bash
# Run item strategy unit and use case integration tests
uv run pytest apps/api/test/test_game_unit.py apps/api/test/test_gamification_state.py -v

# Run full backend test suite
uv run pytest apps/api/test/
```

### Expected Output:
- All 149+ backend tests pass with 0 errors.
- Unit tests for `MicroscopeItemStrategy`, `TimeFreezeItemStrategy`, and `GameItemRegistry` execute and pass.

---

## 3. Manual Scenario Verification

### Scenario A: Instant Item - Microscope (`50-50`)
1. **Start or resume a session**: Ensure session is `IN_PROGRESS` with at least 50 gold.
2. **Execute Item**:
   ```bash
   curl -X POST "http://localhost:8000/api/v1/game/sessions/{SESSION_ID}/use-item" \
     -H "Authorization: Bearer {TOKEN}" \
     -H "Content-Type: application/json" \
     -d '{"item_name": "microscope", "question_id": "{ACTIVE_QUESTION_ID}"}'
   ```
3. **Verify Outcome**:
   - HTTP 200 OK
   - `eliminated_option_ids` contains exactly 2 incorrect option IDs.
   - `updated_gamification.gold` decreased by 50 (or 100 in boss mode).

### Scenario B: Instant Item - Time Freeze (`freeze`)
1. **Execute Item**:
   ```bash
   curl -X POST "http://localhost:8000/api/v1/game/sessions/{SESSION_ID}/use-item" \
     -H "Authorization: Bearer {TOKEN}" \
     -H "Content-Type: application/json" \
     -d '{"item_name": "time_freeze", "question_id": "{ACTIVE_QUESTION_ID}"}'
   ```
2. **Verify Outcome**:
   - HTTP 200 OK
   - `time_freeze_active` is `true`.
   - `updated_gamification.gold` decreased by 40 (or 80 in boss mode).

### Scenario C: Turn Buff Rejection via Instant Endpoint
1. **Execute Item with `double_points` or `shield`**:
   ```bash
   curl -X POST "http://localhost:8000/api/v1/game/sessions/{SESSION_ID}/use-item" \
     -H "Authorization: Bearer {TOKEN}" \
     -H "Content-Type: application/json" \
     -d '{"item_name": "double_points", "question_id": "{ACTIVE_QUESTION_ID}"}'
   ```
2. **Verify Outcome**:
   - HTTP 400 Bad Request
   - Detail: `"Item double_points must be activated when submitting your answer"`.
   - Gold is NOT deducted.

### Scenario D: Unknown Item Lookup Failure
1. **Execute with non-existent item**:
   ```bash
   curl -X POST "http://localhost:8000/api/v1/game/sessions/{SESSION_ID}/use-item" \
     -H "Authorization: Bearer {TOKEN}" \
     -H "Content-Type: application/json" \
     -d '{"item_name": "laser_beam", "question_id": "{ACTIVE_QUESTION_ID}"}'
   ```
2. **Verify Outcome**:
   - HTTP 400 Bad Request
   - Detail: `"Invalid item: laser_beam"`.

---

## 4. Code Quality & Pre-commit Check

```bash
# Verify Python linting & formatting
uv run ruff check apps/api
uv run ruff format --check apps/api

# Run full project checks
make check
```
