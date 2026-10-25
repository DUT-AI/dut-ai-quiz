"""create game_session_answers and backfill

Revision ID: e01a2b3c4d5e
Revises: d76f5b913a02
Create Date: 2026-10-25 04:15:00.000000

"""

import json
import uuid
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "e01a2b3c4d5e"
down_revision: str | None = "d76f5b913a02"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # 1. Create game_session_answers table
    op.create_table(
        "game_session_answers",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column(
            "session_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("game_sessions.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "question_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("questions.id", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column("option_id", sa.String(length=64), nullable=False),
        sa.Column("is_correct", sa.Boolean(), nullable=False),
        sa.Column("time_response", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("points_gained", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("gold_gained", sa.Integer(), nullable=False, server_default="0"),
        sa.Column(
            "answered_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.UniqueConstraint("session_id", "question_id", name="uq_game_session_answer_turn"),
    )
    op.create_index("idx_game_session_answers_session_id", "game_session_answers", ["session_id"])
    op.create_index("idx_game_session_answers_question_id", "game_session_answers", ["question_id"])

    # 2. Data backfill from legacy snapshots
    bind = op.get_bind()

    # Preload correct options map from questions table for ground-truth correctness verification
    q_rows = bind.execute(
        sa.text("SELECT id, options FROM questions WHERE options IS NOT NULL")
    ).fetchall()
    valid_q_id_strings = {str(r[0]) for r in q_rows}
    correct_options_map: dict[tuple[str, str], bool] = {}
    for q_id, opts in q_rows:
        if isinstance(opts, str):
            try:
                opts = json.loads(opts)
            except Exception:
                opts = []
        if isinstance(opts, list):
            for o in opts:
                if isinstance(o, dict):
                    oid = str(o.get("id", ""))
                    is_c = bool(o.get("is_correct", False))
                    correct_options_map[(str(q_id), oid)] = is_c

    sessions = bind.execute(
        sa.text("SELECT id, snapshot FROM game_sessions WHERE snapshot IS NOT NULL")
    ).fetchall()

    for row in sessions:
        session_id = row[0]
        snap = row[1]
        if isinstance(snap, str):
            try:
                snap = json.loads(snap)
            except Exception:
                continue
        if not isinstance(snap, dict):
            continue

        raw_answers = snap.get("answers", {})
        raw_questions = snap.get("questions", [])

        # Build map of questions by ID
        q_map = {}
        for q in raw_questions:
            qid_str = str(q.get("id", ""))
            if qid_str:
                q_map[qid_str] = q

        new_sequence = []
        for q in raw_questions:
            qid_str = str(q.get("id", ""))
            if qid_str:
                new_sequence.append(
                    {
                        "id": qid_str,
                        "tier": int(q.get("tier", 1)),
                        "is_boss": bool(q.get("is_boss", False)),
                        "time_limit": int(q.get("time_limit", 60)),
                    }
                )

        # Insert answer logs for answered questions
        for qid_str, opt_id_str in raw_answers.items():
            if not qid_str or not opt_id_str:
                continue
            try:
                q_uuid = uuid.UUID(qid_str)
            except Exception:
                continue
            if str(q_uuid) not in valid_q_id_strings:
                continue
            opt_val = str(opt_id_str)

            # Ground truth correctness from questions catalog, fallback to snapshot options
            is_corr = correct_options_map.get((qid_str, opt_val), False)
            if not is_corr:
                q_info = q_map.get(qid_str, {})
                for opt in q_info.get("options", []):
                    if str(opt.get("id")) == opt_val and opt.get("is_correct") is True:
                        is_corr = True
                        break

            q_info = q_map.get(qid_str, {})
            time_resp = float(q_info.get("time_response", 0.0))

            bind.execute(
                sa.text("""
                    INSERT INTO game_session_answers
                    (id, session_id, question_id, option_id, is_correct, time_response, points_gained, gold_gained, answered_at)
                    VALUES (:id, :session_id, :question_id, :option_id, :is_correct, :time_response, :points, :gold, NOW())
                    ON CONFLICT ON CONSTRAINT uq_game_session_answer_turn DO NOTHING
                """),
                {
                    "id": uuid.uuid4(),
                    "session_id": session_id,
                    "question_id": q_uuid,
                    "option_id": opt_val,
                    "is_correct": is_corr,
                    "time_response": time_resp,
                    "points": 10 if is_corr else 0,
                    "gold": 20 if is_corr else 0,
                },
            )

        # Update session snapshot to streamlined lightweight metadata if legacy fields present
        if "questions" in snap or "answers" in snap:
            streamlined_snapshot = {
                "lesson_slug": snap.get("lesson_slug", ""),
                "question_sequence": new_sequence
                if new_sequence
                else snap.get("question_sequence", []),
                "gamification": snap.get("gamification", {}),
            }
            bind.execute(
                sa.text("UPDATE game_sessions SET snapshot = :snap WHERE id = :sid"),
                {"snap": json.dumps(streamlined_snapshot), "sid": session_id},
            )


def downgrade() -> None:
    op.drop_index("idx_game_session_answers_question_id", table_name="game_session_answers")
    op.drop_index("idx_game_session_answers_session_id", table_name="game_session_answers")
    op.drop_table("game_session_answers")
