"""update_practice_questions_to_game

Revision ID: e88afa090f4e
Revises: d6bc9878adb2
Create Date: 2026-07-06 17:16:42.524699

"""
from collections.abc import Sequence

from alembic import op

# revision identifiers, used by Alembic.
revision: str = 'e88afa090f4e'
down_revision: str | None = 'd6bc9878adb2'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Update existing PRACTICE questions to GAME
    op.execute("UPDATE questions SET pool_type = 'GAME' WHERE pool_type = 'PRACTICE'")


def downgrade() -> None:
    # Revert GAME questions back to PRACTICE
    op.execute("UPDATE questions SET pool_type = 'PRACTICE' WHERE pool_type = 'GAME'")
