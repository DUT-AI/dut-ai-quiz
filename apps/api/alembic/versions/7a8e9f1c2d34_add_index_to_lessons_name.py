"""add index to lessons name

Revision ID: 7a8e9f1c2d34
Revises: 2f77daa7bb6f
Create Date: 2026-10-06 15:51:00.000000

"""
from collections.abc import Sequence

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "7a8e9f1c2d34"
down_revision: str | None = "2f77daa7bb6f"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_index(op.f("ix_lessons_name"), "lessons", ["name"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_lessons_name"), table_name="lessons")
