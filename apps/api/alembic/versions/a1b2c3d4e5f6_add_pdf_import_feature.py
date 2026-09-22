"""Add PDF import feature: import_sessions table + alter questions.

Revision ID: a1b2c3d4e5f6
Revises: ed8412cf32e4
Create Date: 2026-07-25 12:00:00.000000

"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers
revision = "a1b2c3d4e5f6"
down_revision = "ed8412cf32e4"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── 1. Create import_sessions table ─────────────────────────────────────
    op.create_table(
        "import_sessions",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            nullable=False,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("file_name", sa.String(255), nullable=False, server_default=""),
        sa.Column("total_questions", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("processed_questions", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("status", sa.String(20), nullable=False, server_default="PROCESSING"),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("lesson_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("target_scope", sa.String(20), nullable=False, server_default="LESSON"),
        sa.Column(
            "created_at",
            sa.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_import_sessions_user_id", "import_sessions", ["user_id"])
    op.create_index("ix_import_sessions_status", "import_sessions", ["status"])

    # ── 2. Alter questions table ─────────────────────────────────────────────
    op.add_column(
        "questions",
        sa.Column("status", sa.String(20), nullable=False, server_default="PUBLIC"),
    )
    op.add_column(
        "questions",
        sa.Column("import_session_id", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.add_column(
        "questions",
        sa.Column("is_answer_ai_generated", sa.Boolean(), nullable=False, server_default="false"),
    )
    op.add_column(
        "questions",
        sa.Column("is_solution_ai_generated", sa.Boolean(), nullable=False, server_default="false"),
    )
    op.add_column(
        "questions",
        sa.Column(
            "is_difficulty_ai_suggested", sa.Boolean(), nullable=False, server_default="false"
        ),
    )
    op.add_column(
        "questions",
        sa.Column("duplicate_status", sa.String(30), nullable=False, server_default="UNIQUE"),
    )
    op.add_column(
        "questions",
        sa.Column("duplicate_of_question_id", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.add_column(
        "questions",
        sa.Column("review_locked_by", sa.Integer(), nullable=True),
    )
    op.add_column(
        "questions",
        sa.Column("review_locked_at", sa.TIMESTAMP(timezone=True), nullable=True),
    )

    # Foreign keys
    op.create_foreign_key(
        "fk_questions_import_session",
        "questions",
        "import_sessions",
        ["import_session_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_foreign_key(
        "fk_questions_duplicate_of",
        "questions",
        "questions",
        ["duplicate_of_question_id"],
        ["id"],
        ondelete="SET NULL",
    )

    # Indexes
    op.create_index("ix_questions_status", "questions", ["status"])
    op.create_index("ix_questions_import_session_id", "questions", ["import_session_id"])


def downgrade() -> None:
    op.drop_index("ix_questions_import_session_id", "questions")
    op.drop_index("ix_questions_status", "questions")
    op.drop_constraint("fk_questions_duplicate_of", "questions", type_="foreignkey")
    op.drop_constraint("fk_questions_import_session", "questions", type_="foreignkey")
    op.drop_column("questions", "review_locked_at")
    op.drop_column("questions", "review_locked_by")
    op.drop_column("questions", "duplicate_of_question_id")
    op.drop_column("questions", "duplicate_status")
    op.drop_column("questions", "is_difficulty_ai_suggested")
    op.drop_column("questions", "is_solution_ai_generated")
    op.drop_column("questions", "is_answer_ai_generated")
    op.drop_column("questions", "import_session_id")
    op.drop_column("questions", "status")
    op.drop_index("ix_import_sessions_status", "import_sessions")
    op.drop_index("ix_import_sessions_user_id", "import_sessions")
    op.drop_table("import_sessions")
