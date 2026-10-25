# Data Model: Game Session Schema Normalization

**Feature**: `008-game-session-schema-normalization`  
**Date**: 2026-10-25  
**Spec**: [spec.md](file:///Users/nguyenhuynh/Documents/projects/dut-ai-quiz/specs/008-game-session-schema-normalization/spec.md)

---

## 1. Database Table Schema (`game_sessions`)

```sql
CREATE TABLE game_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lesson_slug VARCHAR(100) NOT NULL,
    status game_session_status NOT NULL DEFAULT 'IN_PROGRESS',
    started_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    completed_at TIMESTAMP WITHOUT TIME ZONE,
    question_limit INTEGER NOT NULL DEFAULT 10,
    
    -- Scoring & Ranking Metrics (Native Indexed Columns)
    final_score DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    gold_earned INTEGER NOT NULL DEFAULT 0,
    total_time_response DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    attempt_count INTEGER NOT NULL DEFAULT 1,
    current_tier INTEGER NOT NULL DEFAULT 1,
    
    -- Structured Sequence & Runtime Gamification State
    question_sequence JSONB NOT NULL DEFAULT '[]'::jsonb,
    gamification_state JSONB NOT NULL DEFAULT '{}'::jsonb
);
```

### Table Indexes

| Index Name | Columns / Expressions | Type | Purpose |
| :--- | :--- | :--- | :--- |
| `idx_game_sessions_user_id` | `(user_id)` | B-Tree | History queries by user |
| `idx_game_sessions_lesson_slug` | `(lesson_slug)` | B-Tree | Filtering sessions by lesson |
| `idx_game_sessions_user_lesson_status` | `(user_id, lesson_slug, status)` | B-Tree | Finding active session (`get_active_by_lesson`) |
| `idx_game_sessions_leaderboard` | `(lesson_slug, status, question_limit, final_score DESC, gold_earned DESC, total_time_response ASC)` | B-Tree | Ultra-fast Leaderboard generation |

---

## 2. Domain Entity (`GameSessionEntity`)

Located in [`apps/api/app/domain/entities/game.py`](file:///Users/nguyenhuynh/Documents/projects/dut-ai-quiz/apps/api/app/domain/entities/game.py):

```python
@dataclasses.dataclass
class GameSessionEntity:
    id: UUID
    user_id: int
    lesson_slug: str
    started_at: datetime
    completed_at: datetime | None
    status: GameSessionStatus
    question_limit: int = 10
    
    # Normalized Ranking & Scoring Metrics
    final_score: float = 0.0
    gold_earned: int = 0
    total_time_response: float = 0.0
    attempt_count: int = 1
    current_tier: int = 1
    
    # Structured sequence & runtime state
    question_sequence: list[QuestionMeta] = dataclasses.field(default_factory=list)
    gamification: GamificationState = dataclasses.field(default_factory=GamificationState)
```

### State Synchronization
- When `gamification.record_correct_answer(...)` or `record_incorrect_answer(...)` is called:
  - `entity.final_score = entity.gamification.final_score`
  - `entity.gold_earned = entity.gamification.gold`
  - `entity.total_time_response = entity.gamification.total_time_response`
  - `entity.attempt_count = entity.gamification.attempt_count`
  - `entity.current_tier = entity.gamification.current_tier`
- `to_dict()` for `gamification_state`: serializes `gamification.to_dict()`.

---

## 3. Persistence Model (`GameSession`)

Located in [`apps/api/app/infrastructure/persistence/models/game.py`](file:///Users/nguyenhuynh/Documents/projects/dut-ai-quiz/apps/api/app/infrastructure/persistence/models/game.py):

```python
class GameSession(Base):
    __tablename__ = "game_sessions"

    id: Mapped[UUID] = mapped_column(pgUUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    lesson_slug: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    status: Mapped[GameSessionStatus] = mapped_column(Enum(GameSessionStatus, name="game_session_status"), nullable=False, default=GameSessionStatus.IN_PROGRESS)
    started_at: Mapped[datetime] = mapped_column(DateTime, default=now_ict, nullable=False)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    question_limit: Mapped[int] = mapped_column(Integer, nullable=False, default=10)

    # Scoring & Ranking Columns
    final_score: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    gold_earned: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    total_time_response: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    attempt_count: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    current_tier: Mapped[int] = mapped_column(Integer, nullable=False, default=1)

    # Structured Sequence & Gamification State
    question_sequence: Mapped[list[dict[str, Any]]] = mapped_column(JSONB, nullable=False, default=list)
    gamification_state: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False, default=dict)
```

---

## 4. Query Transformations in Repository

| Operation | Legacy Implementation (Snapshot JSON) | Normalized Implementation |
| :--- | :--- | :--- |
| **Get Active Session** | `where(tags_filter.contains([lesson_slug]))` | `where(GameSession.lesson_slug == lesson_slug)` (Index Scan) |
| **Count Completed** | `where(tags_filter.contains([lesson_slug]))` | `where(GameSession.lesson_slug == lesson_slug)` (Index Scan) |
| **Leaderboard Order By** | `cast(snapshot['gamification']['final_score'].astext, Float).desc()` | `order_by(GameSession.final_score.desc(), GameSession.gold_earned.desc(), ...)` (Index Scan) |
| **User Match History** | `s.tags_filter[0]` | `s.lesson_slug` (Direct column) |
