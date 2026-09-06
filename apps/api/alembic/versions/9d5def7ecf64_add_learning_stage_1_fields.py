"""add learning stage 1 fields

Revision ID: 9d5def7ecf64
Revises: a67e7585462d
Create Date: 2026-06-26 14:20:09.946269

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "9d5def7ecf64"
down_revision: str | None = "a67e7585462d"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "lessons",
        sa.Column("content_md", sa.String(), server_default="", nullable=False),
    )

    op.drop_index(
        op.f("ix_lessons_order"),
        table_name="lessons",
        if_exists=True,
    )

    difficulty_enum = postgresql.ENUM(
        "EASY",
        "MEDIUM",
        "HARD",
        name="difficulty",
        create_type=False,
    )

    op.add_column(
        "questions",
        sa.Column(
            "difficulty",
            difficulty_enum,
            server_default="EASY",
            nullable=False,
        ),
    )

    op.create_index(
        op.f("ix_questions_difficulty"),
        "questions",
        ["difficulty"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        op.f("ix_questions_difficulty"),
        table_name="questions",
        if_exists=True,
    )

    op.drop_column("questions", "difficulty")

    op.create_index(
        op.f("ix_lessons_order"),
        "lessons",
        ["order"],
        unique=False,
    )

    op.drop_column("lessons", "content_md")
