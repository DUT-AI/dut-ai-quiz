import dataclasses
from datetime import datetime
from typing import Any
from uuid import UUID

from app.domain.value_objects import GameSessionStatus
from app.domain.value_objects.gamification import (
    GameSessionSnapshot,
    GamificationState,
    QuestionMeta,
    QuestionSnapshot,
)


@dataclasses.dataclass
class GameSessionEntity:
    id: UUID
    user_id: int
    started_at: datetime
    completed_at: datetime | None
    status: GameSessionStatus
    question_sequence: list[QuestionMeta] = dataclasses.field(default_factory=list)
    gamification: GamificationState = dataclasses.field(default_factory=GamificationState)
    tags_filter: list[str] = dataclasses.field(default_factory=list)
    question_limit: int = 10
    snapshot: dict[str, Any] | None = None
    legacy_answers: dict[str, Any] = dataclasses.field(default_factory=dict)

    def __post_init__(self) -> None:
        if self.snapshot:
            if not self.question_sequence:
                raw_seq = self.snapshot.get("question_sequence")
                if raw_seq is not None:
                    self.question_sequence = [QuestionMeta.from_dict(q) for q in raw_seq]
                else:
                    self.question_sequence = [
                        QuestionMeta(
                            id=str(q.get("id", "")),
                            tier=int(q.get("tier", 1)),
                            is_boss=bool(q.get("is_boss", False)),
                            time_limit=int(q.get("time_limit", 60)),
                        )
                        for q in self.snapshot.get("questions", [])
                    ]
            if "gamification" in self.snapshot:
                self.gamification = GamificationState.from_dict(self.snapshot.get("gamification"))
            if "answers" in self.snapshot:
                self.legacy_answers = dict(self.snapshot.get("answers", {}))
        self.snapshot = self.snapshot_dict

    @property
    def current_question_meta(self) -> QuestionMeta | None:
        idx = self.gamification.last_question_index
        if 0 <= idx < len(self.question_sequence):
            return self.question_sequence[idx]
        return None

    @property
    def is_all_answered(self) -> bool:
        return self.gamification.last_question_index >= len(self.question_sequence)

    @property
    def is_game_over(self) -> bool:
        return self.gamification.is_game_over(len(self.question_sequence))

    @property
    def snapshot_dict(self) -> dict[str, Any]:
        return {
            "lesson_slug": self.tags_filter[0] if self.tags_filter else "",
            "question_sequence": [q.to_dict() for q in self.question_sequence],
            "gamification": self.gamification.to_dict(),
        }

    # Backward compatibility property for snapshot dict access
    @property
    def snapshot_state(self) -> dict[str, Any]:
        return self.snapshot_dict

    def get_snapshot_state(self) -> GameSessionSnapshot:
        questions = [
            QuestionSnapshot(
                id=q.id,
                content="",
                options=[],
                tier=q.tier,
                is_boss=q.is_boss,
                time_limit=q.time_limit,
            )
            for q in self.question_sequence
        ]
        return GameSessionSnapshot(
            lesson_slug=self.tags_filter[0] if self.tags_filter else "",
            questions=questions,
            answers={},
            gamification=self.gamification,
        )

    def set_snapshot_state(self, snap: GameSessionSnapshot) -> None:
        self.gamification = snap.gamification
