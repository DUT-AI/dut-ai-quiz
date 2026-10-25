"""normalize game_sessions schema

Revision ID: f01a2b3c4d5e
Revises: e01a2b3c4d5e
Create Date: 2026-10-25 15:40:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "f01a2b3c4d5e"
down_revision: str | None = "e01a2b3c4d5e"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # 1. Add new normalized columns with nullable / server defaults
    op.add_column("game_sessions", sa.Column("lesson_slug", sa.String(length=100), nullable=True))
    op.add_column(
        "game_sessions",
        sa.Column("final_score", sa.Float(), nullable=False, server_default="0.0"),
    )
    op.add_column(
        "game_sessions",
        sa.Column("gold_earned", sa.Integer(), nullable=False, server_default="0"),
    )
    op.add_column(
        "game_sessions",
        sa.Column("total_time_response", sa.Float(), nullable=False, server_default="0.0"),
    )
    op.add_column(
        "game_sessions",
        sa.Column("attempt_count", sa.Integer(), nullable=False, server_default="1"),
    )
    op.add_column(
        "game_sessions",
        sa.Column("current_tier", sa.Integer(), nullable=False, server_default="1"),
    )
    op.add_column(
        "game_sessions",
        sa.Column(
            "question_sequence",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default="[]",
        ),
    )
    op.add_column(
        "game_sessions",
        sa.Column(
            "gamification_state",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default="{}",
        ),
    )

    # 2. Backfill data from tags_filter and snapshot
    bind = op.get_bind()
    bind.execute(
        sa.text("""
            UPDATE game_sessions
            SET lesson_slug = COALESCE(
                NULLIF(tags_filter[1], ''),
                NULLIF(snapshot->>'lesson_slug', ''),
                'unknown'
            ),
            final_score = COALESCE((snapshot->'gamification'->>'final_score')::float, 0.0),
            gold_earned = COALESCE((snapshot->'gamification'->>'gold')::int, 0),
            total_time_response = COALESCE((snapshot->'gamification'->>'total_time_response')::float, 0.0),
            attempt_count = COALESCE((snapshot->'gamification'->>'attempt_count')::int, 1),
            current_tier = COALESCE((snapshot->'gamification'->>'current_tier')::int, 1),
            question_sequence = COALESCE(snapshot->'question_sequence', '[]'::jsonb),
            gamification_state = COALESCE(snapshot->'gamification', '{}'::jsonb)
        """)
    )

    # 3. Enforce NOT NULL on lesson_slug
    op.alter_column("game_sessions", "lesson_slug", nullable=False)

    # 4. Drop legacy columns
    op.drop_column("game_sessions", "tags_filter")
    op.drop_column("game_sessions", "snapshot")

    # 5. Create performance indexes
    op.create_index("idx_game_sessions_lesson_slug", "game_sessions", ["lesson_slug"])
    op.create_index(
        "idx_game_sessions_user_lesson_status",
        "game_sessions",
        ["user_id", "lesson_slug", "status"],
    )
    op.create_index("idx_game_sessions_final_score", "game_sessions", ["final_score"])
    op.create_index("idx_game_sessions_gold_earned", "game_sessions", ["gold_earned"])
    op.create_index(
        "idx_game_sessions_leaderboard",
        "game_sessions",
        [
            "lesson_slug",
            "status",
            "question_limit",
            sa.text("final_score DESC"),
            sa.text("gold_earned DESC"),
            sa.text("total_time_response ASC"),
            sa.text("attempt_count ASC"),
        ],
    )


def downgrade() -> None:
    # Drop new indexes
    op.drop_index("idx_game_sessions_leaderboard", table_name="game_sessions")
    op.drop_index("idx_game_sessions_gold_earned", table_name="game_sessions")
    op.drop_index("idx_game_sessions_final_score", table_name="game_sessions")
    op.drop_index("idx_game_sessions_user_lesson_status", table_name="game_sessions")
    op.drop_index("idx_game_sessions_lesson_slug", table_name="game_sessions")

    # Re-add legacy columns
    op.add_column(
        "game_sessions",
        sa.Column(
            "tags_filter",
            postgresql.ARRAY(sa.String()),
            nullable=False,
            server_default="{}",
        ),
    )
    op.add_column(
        "game_sessions",
        sa.Column("snapshot", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    )

    # Backfill legacy columns
    bind = op.get_bind()
    bind.execute(
        sa.text("""
            UPDATE game_sessions
            SET tags_filter = ARRAY[lesson_slug],
                snapshot = jsonb_build_object(
                    'lesson_slug', lesson_slug,
                    'question_sequence', question_sequence,
                    'gamification', gamification_state
                )
        """)
    )

    # Drop new columns
    op.drop_column("game_sessions", "gamification_state")
    op.drop_column("game_sessions", "question_sequence")
    op.drop_column("game_sessions", "current_tier")
    op.drop_column("game_sessions", "attempt_count")
    op.drop_column("game_sessions", "total_time_response")
    op.drop_column("game_sessions", "gold_earned")
    op.drop_column("game_sessions", "final_score")
    op.drop_column("game_sessions", "lesson_slug")
