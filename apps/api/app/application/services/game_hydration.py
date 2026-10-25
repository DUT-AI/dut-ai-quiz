from uuid import UUID

from app.domain.entities.game import GameSessionEntity
from app.domain.interfaces import IQuestionRepository
from app.domain.value_objects.gamification import QuestionMeta
from app.presentation.schemas.game import (
    GameQuestionOptionOut,
    GameQuestionSnapshotOut,
    GameSessionSnapshotOut,
    GameSessionStartOut,
    GamificationStateOut,
)


async def hydrate_question_snapshot(
    meta: QuestionMeta, question_repo: IQuestionRepository
) -> GameQuestionSnapshotOut:
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

    q_db = await question_repo.get(q_uuid)
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
            id=str(opt.id), text=getattr(opt, "content", getattr(opt, "text", ""))
        )
        for opt in (q_db.options or [])
    ]
    return GameQuestionSnapshotOut(
        id=str(q_db.id),
        content=q_db.content,
        options=opts,
        time_limit=meta.time_limit,
        tier=meta.tier,
        is_boss=meta.is_boss,
    )


async def hydrate_session_start_out(
    session: GameSessionEntity, question_repo: IQuestionRepository
) -> GameSessionStartOut:
    """
    Hydrate active game session for client consumption.
    Hydrates ONLY the active question's content and options, keeping metadata
    placeholders for remaining questions to preserve client progress indicators.
    """
    idx = session.gamification.last_question_index
    questions_out: list[GameQuestionSnapshotOut] = []

    for i, meta in enumerate(session.question_sequence):
        if i == idx:
            q_hydrated = await hydrate_question_snapshot(meta, question_repo)
            questions_out.append(q_hydrated)
        else:
            questions_out.append(
                GameQuestionSnapshotOut(
                    id=str(meta.id),
                    content="",
                    options=[],
                    time_limit=meta.time_limit,
                    tier=meta.tier,
                    is_boss=meta.is_boss,
                )
            )

    snap_out = GameSessionSnapshotOut(
        lesson_slug=session.tags_filter[0] if session.tags_filter else "",
        questions=questions_out,
        answers={},
        gamification=GamificationStateOut.model_validate(session.gamification.to_dict()),
    )
    return GameSessionStartOut(session_id=str(session.id), snapshot=snap_out)
