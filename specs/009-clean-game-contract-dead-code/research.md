# Research: Clean Game Session API Contract & Dead Code Elimination

**Feature Branch**: `009-clean-game-contract-dead-code`  
**Date**: 2026-10-25  
**Spec**: [spec.md](spec.md)

---

## 1. DTO Schema Unification: `GameSessionOut`

### Context & Problem
Currently, the API exposes two disparate schemas for game sessions:
- `GameSessionStartOut`: contains `session_id: str` (string) and `snapshot: GameSessionSnapshotOut`.
- `GameSessionDetailOut`: contains `id: UUID` (UUID), `user_id: int`, `started_at: datetime`, `completed_at: datetime | None`, `status: str`, `lesson_slug: str`, `snapshot: GameSessionSnapshotOut | None`, `tags_filter: list[str]`, `question_limit: int`.

Inside `GameSessionSnapshotOut`, data is arbitrarily grouped:
```python
class GameSessionSnapshotOut(BaseModel):
    lesson_slug: str = ""
    questions: list[GameQuestionSnapshotOut] = Field(default_factory=list)
    answers: dict[str, str] = Field(default_factory=dict)
    gamification: GamificationStateOut = Field(default_factory=GamificationStateOut)
```
This causes:
1. Double-nesting: Frontend must inspect `res.snapshot.gamification.lives` instead of `res.gamification.lives`.
2. Redundant keys: `lesson_slug` is echoed in both top-level and snapshot.
3. Inconsistent IDs: `session_id` vs `id`.
4. Over-fetching: Full sequences were previously dumped into snapshot questions.

### Decision
Unify both schemas into a single, canonical `GameSessionOut`:
```python
class GameSessionOut(BaseModel):
    id: UUID
    user_id: int
    lesson_slug: str
    status: str
    started_at: datetime
    completed_at: datetime | None = None
    question_limit: int = 10
    current_question_index: int = 0
    current_question: GameQuestionSnapshotOut | None = None
    gamification: GamificationStateOut = Field(default_factory=GamificationStateOut)

    model_config = {"from_attributes": True}
```
Endpoints returning `GameSessionOut`:
- `POST /game/sessions` (Start new or return existing active session)
- `GET /game/sessions/active` (Resume active session)
- `GET /game/sessions/{session_id}` (Get session details)
- `POST /game/sessions/{session_id}/finish` (Finish/abandon session)

For `GET /game/history`, return `list[GameSessionOut]` (where `current_question` is null for completed sessions, and `gamification.final_score`, `gamification.gold`, etc. represent final results).

### Rationale
- One single model represents the entire lifecycle of a session.
- Client types generated via `openapi-typescript` are clean, intuitive, and eliminate custom unwrapping logic.

### Alternatives Considered
- *Separate StartSessionOut and DetailSessionOut*: Rejected because keeping them split provides no real domain distinction and forces frontend code to maintain union types like `StartGameSessionResponse | GameSession`.

---

## 2. Pruning `GamificationAnswerResultOut`

### Context & Problem
When answering a question (`PATCH /game/sessions/{session_id}/answers`), the backend returns:
```python
class GamificationAnswerResultOut(BaseModel):
    is_correct: bool
    points_gained: int
    coins_gained: int
    updated_gamification: GamificationStateOut
    is_game_over: bool
    correct_option_id: str | None = None
    next_question: GameQuestionSnapshotOut | None = None
    snapshot: GameSessionSnapshotOut | None = None  # <--- DEAD / REDUNDANT
```
`snapshot` was included for backward compatibility when early frontend versions refreshed the whole state. Modern frontend (`use-game-turn.ts`) does not read `snapshot` at all; it only consumes `updated_gamification`, `is_correct`, `points_gained`, `coins_gained`, `is_game_over`, and `next_question`.

### Decision
Drop `snapshot` from `GamificationAnswerResultOut`:
```python
class GamificationAnswerResultOut(BaseModel):
    is_correct: bool
    points_gained: int
    coins_gained: int
    updated_gamification: GamificationStateOut
    is_game_over: bool
    correct_option_id: str | None = None
    next_question: GameQuestionSnapshotOut | None = None

    model_config = {"from_attributes": True}
```

### Rationale
- Saves 5KB–15KB per answer request.
- Removes confusion about which field is the source of truth for the player's updated state.

### Alternatives Considered
- *Keep snapshot as None*: Rejected because it leaves dead fields in the OpenAPI schema.

---

## 3. Total Eradication of `tags_filter`

### Context & Problem
`tags_filter` was an array column in PostgreSQL (`tags_filter ARRAY(String)`) before migration `f01a2b3c4d5e`. When normalized, `lesson_slug` became the primary column, but `tags_filter` was retained as a shim property:
- `tags_filter: list[str] = [self.lesson_slug]` in `GameSessionEntity`.
- `tags_filter: list[str]` in `GameSessionDetailOut`.
- Frontend types maintaining `tags_filter: string[]`.

### Decision
Permanently delete `tags_filter` from:
1. `GameSessionEntity` (constructor, fields, and `@property tags_filter`).
2. `GameSessionDetailOut` / `GameSessionOut`.
3. `GameHydrationService`.
4. Test fixtures in `apps/api/test/`.
5. Frontend types in `apps/web/features/game/types.ts`.

### Rationale
- Zero reason to keep an array with 1 element `[lesson_slug]` when `lesson_slug` is already an explicit string.
- Cleanses the API schema of deprecated terminology.

---

## 4. Elimination of Dead Transitional Methods on `GameSessionEntity`

### Context & Problem
`GameSessionEntity` contains:
```python
@property
def tags_filter(self) -> list[str]:
    return [self.lesson_slug] if self.lesson_slug else []

@property
def snapshot(self) -> dict[str, Any]:
    return {
        "lesson_slug": self.lesson_slug,
        "question_sequence": [q.to_dict() for q in self.question_sequence],
        "gamification": self.gamification.to_dict(),
    }
```
These properties were only created to avoid breaking tests during the database migration.

### Decision
Delete both properties. `GameSessionEntity` has explicit attributes:
- `id: UUID`
- `user_id: int`
- `lesson_slug: str`
- `status: GameSessionStatus`
- `started_at: datetime`
- `completed_at: datetime | None`
- `question_limit: int`
- `question_sequence: list[QuestionMeta]`
- `gamification: GamificationState`

### Rationale
- Domain entities must be pure and free from legacy baggage.
- All use cases access `session.lesson_slug`, `session.question_sequence`, and `session.gamification` directly.

---

## 5. Elimination of Standalone Helpers in `game_hydration.py`

### Context & Problem
At the bottom of `apps/api/app/application/services/game_hydration.py`, two helper functions were left:
```python
async def hydrate_question_snapshot(meta, question_repo): ...
async def hydrate_session_start_out(session, question_repo): ...
```
Neither is used anywhere in the codebase. All callers instantiate or inject `GameHydrationService`.

### Decision
Delete both functions. `GameHydrationService` is the single source of truth for hydration logic.

---

## 6. Frontend Contract-Driven Synchronization

### Context & Problem
`apps/web/features/game/types.ts` manually re-declares:
```typescript
export interface GameSession {
  id: string;
  user_id: number;
  started_at: string;
  completed_at?: string | null;
  status: "IN_PROGRESS" | "COMPLETED";
  snapshot?: GameSnapshot | null;
  tags_filter: string[];
  question_limit: number;
}
```
And `use-game-session.ts` unpacks `sessionData?.snapshot`.

### Decision
1. Run `make generate-api` to generate new TypeScript types reflecting `GameSessionOut` and updated `GamificationAnswerResultOut`.
2. In `apps/web/features/game/types.ts`:
   ```typescript
   export type GameSession = Schema<"GameSessionOut">;
   ```
3. In `use-game-session.ts`:
   - Read `sessionData.gamification` directly.
   - Read `sessionData.current_question` directly for initial question state.
   - Eliminate `snap = sessionData?.snapshot` checks and errors.
4. In `use-game-turn.ts`:
   - Keep lean action dispatching without checking `data.snapshot`.
