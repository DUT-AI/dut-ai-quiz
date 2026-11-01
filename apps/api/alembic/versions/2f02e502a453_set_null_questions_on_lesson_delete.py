"""set_null_questions_on_lesson_delete

Revision ID: 2f02e502a453
Revises: a12b3c4d5e6f
Create Date: 2026-11-01 17:13:28.684356

"""

from collections.abc import Sequence

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "2f02e502a453"
down_revision: str | None = "a12b3c4d5e6f"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.drop_constraint("questions_lesson_id_fkey", "questions", type_="foreignkey")
    op.create_foreign_key(
        "questions_lesson_id_fkey",
        "questions",
        "lessons",
        ["lesson_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint("questions_lesson_id_fkey", "questions", type_="foreignkey")
    op.create_foreign_key(
        "questions_lesson_id_fkey",
        "questions",
        "lessons",
        ["lesson_id"],
        ["id"],
        ondelete="CASCADE",
    )
