"""create lesson_essay_questions table

Revision ID: b23c4d5e6f7a
Revises: 2f02e502a453
Create Date: 2026-11-18 14:58:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "b23c4d5e6f7a"
down_revision: str | None = "2f02e502a453"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "lesson_essay_questions",
        sa.Column(
            "id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False
        ),
        sa.Column(
            "lesson_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("lessons.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("question_md", sa.Text(), nullable=False),
        sa.Column("answer_md", sa.Text(), nullable=False),
        sa.Column("order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column(
            "created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()
        ),
        sa.Column(
            "updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()
        ),
    )
    op.create_index(
        op.f("ix_lesson_essay_questions_lesson_id"),
        "lesson_essay_questions",
        ["lesson_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        op.f("ix_lesson_essay_questions_lesson_id"),
        table_name="lesson_essay_questions",
    )
    op.drop_table("lesson_essay_questions")
