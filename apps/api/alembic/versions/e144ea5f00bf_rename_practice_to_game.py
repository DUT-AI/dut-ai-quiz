"""rename_practice_to_game

Revision ID: e144ea5f00bf
Revises: ab09f896f176
Create Date: 2026-07-06 16:47:14.141092

"""
from collections.abc import Sequence

from alembic import op

# revision identifiers, used by Alembic.
revision: str = 'e144ea5f00bf'
down_revision: str | None = 'ab09f896f176'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Rename table
    op.rename_table('practice_sessions', 'game_sessions')
    # Rename index
    op.execute('ALTER INDEX ix_practice_sessions_user_id RENAME TO ix_game_sessions_user_id')


def downgrade() -> None:
    # Rename index back
    op.execute('ALTER INDEX ix_game_sessions_user_id RENAME TO ix_practice_sessions_user_id')
    # Rename table back
    op.rename_table('game_sessions', 'practice_sessions')
