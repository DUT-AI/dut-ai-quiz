"""link homeworks to lessons

Revision ID: f2c7a1d9e480
Revises: d4a1f9c2b7e6
Create Date: 2026-07-28
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql


revision: str = "f2c7a1d9e480"
down_revision: str | Sequence[str] | None = "d4a1f9c2b7e6"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "homeworks",
        sa.Column(
            "lesson_id",
            postgresql.UUID(as_uuid=True),
            nullable=True,
        ),
    )
    op.create_foreign_key(
        "fk_homeworks_lesson_id",
        "homeworks",
        "lessons",
        ["lesson_id"],
        ["id"],
        ondelete="RESTRICT",
    )
    op.create_index(
        "ix_homeworks_lesson_id",
        "homeworks",
        ["lesson_id"],
    )


def downgrade() -> None:
    op.drop_index("ix_homeworks_lesson_id", table_name="homeworks")
    op.drop_constraint(
        "fk_homeworks_lesson_id",
        "homeworks",
        type_="foreignkey",
    )
    op.drop_column("homeworks", "lesson_id")
