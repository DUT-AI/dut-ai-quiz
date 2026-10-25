from uuid import UUID

from app.domain.entities.game import GameSessionEntity
from app.domain.interfaces import IQuestionRepository
from app.domain.value_objects import GameSessionStatus
from app.domain.value_objects.gamification import QuestionMeta
from app.presentation.schemas.game import (
    GameQuestionOptionOut,
    GameQuestionSnapshotOut,
    GameSessionOut,
    GamificationStateOut,
)


class GameHydrationService:
    """Application Service handling dynamic hydration of questions and sessions."""

    def __init__(self, question_repo: IQuestionRepository) -> None:
        self._question_repo = question_repo

    async def hydrate_question_snapshot(self, meta: QuestionMeta) -> GameQuestionSnapshotOut:
        """Hydrate a single question snapshot with its live text and options from database."""
        try:
            q_uuid = UUID(str(meta.id))
        except Exception:
            return GameQuestionSnapshotOut(
                id=str(meta.id),
                content="",
                options=[],
                time_limit=meta.time_limit,
                tier=meta.tier,
                is_boss=meta.is_boss,
            )

        q_db = await self._question_repo.get(q_uuid)
        if not q_db:
            return GameQuestionSnapshotOut(
                id=str(meta.id),
                content="",
                options=[],
                time_limit=meta.time_limit,
                tier=meta.tier,
                is_boss=meta.is_boss,
            )

        opts = [
            GameQuestionOptionOut(
                id=str(opt.id), text=getattr(opt, "text", getattr(opt, "content", ""))
            )
            for opt in (q_db.options or [])
        ]
        return GameQuestionSnapshotOut(
            id=str(q_db.id),
            content=str(q_db.content) if isinstance(q_db.content, str) else "",
            options=opts,
            time_limit=meta.time_limit,
            tier=meta.tier,
            is_boss=meta.is_boss,
        )

    async def to_session_out(
        self, session: GameSessionEntity, include_current_question: bool = True
    ) -> GameSessionOut:
        """Hydrate session into unified GameSessionOut with the active question."""
        current_q: GameQuestionSnapshotOut | None = None
        idx = session.gamification.last_question_index

        if (
            include_current_question
            and session.status == GameSessionStatus.IN_PROGRESS
            and 0 <= idx < len(session.question_sequence)
        ):
            current_q = await self.hydrate_question_snapshot(session.question_sequence[idx])

        return GameSessionOut(
            id=session.id,
            user_id=session.user_id,
            lesson_slug=session.lesson_slug,
            status=session.status.value
            if hasattr(session.status, "value")
            else str(session.status),
            started_at=session.started_at,
            completed_at=session.completed_at,
            question_limit=session.question_limit,
            current_question_index=idx,
            current_question=current_q,
            gamification=GamificationStateOut.model_validate(session.gamification.to_dict()),
        )

    def to_history_out(self, session: GameSessionEntity) -> GameSessionOut:
        """Map completed historical session into GameSessionOut without question lookups."""
        return GameSessionOut(
            id=session.id,
            user_id=session.user_id,
            lesson_slug=session.lesson_slug,
            status=session.status.value
            if hasattr(session.status, "value")
            else str(session.status),
            started_at=session.started_at,
            completed_at=session.completed_at,
            question_limit=session.question_limit,
            current_question_index=session.gamification.last_question_index,
            current_question=None,
            gamification=GamificationStateOut.model_validate(session.gamification.to_dict()),
        )
