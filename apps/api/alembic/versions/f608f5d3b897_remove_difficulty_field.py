"""remove_difficulty_field

Revision ID: f608f5d3b897
Revises: cf281fd6ea05
Create Date: 2026-04-16 01:48:18.575961

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "f608f5d3b897"
down_revision: str | None = "cf281fd6ea05"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Drop difficulty column from questions
    op.drop_column("questions", "difficulty")
    # Drop difficulty_filter column from practice_sessions
    op.drop_column("practice_sessions", "difficulty_filter")


def downgrade() -> None:
    # Add difficulty column to questions
    op.add_column("questions", sa.Column("difficulty", sa.String(), nullable=True))
    # Add difficulty_filter column to practice_sessions
    op.add_column("practice_sessions", sa.Column("difficulty_filter", sa.String(), nullable=True))
