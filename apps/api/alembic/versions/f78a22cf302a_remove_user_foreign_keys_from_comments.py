"""remove user foreign keys from comments

Revision ID: f78a22cf302a
Revises: 7d4a91c2f6b8
Create Date: 2026-07-26

"""
from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = 'f78a22cf302a'
down_revision: Union[str, None] = '7d4a91c2f6b8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Some deployed databases were created without these user foreign keys.
    # PostgreSQL's IF EXISTS keeps the migration safe for both schema variants.
    op.execute(
        "ALTER TABLE comments "
        "DROP CONSTRAINT IF EXISTS comments_user_id_fkey"
    )
    op.execute(
        "ALTER TABLE comment_reactions "
        "DROP CONSTRAINT IF EXISTS comment_reactions_user_id_fkey"
    )


def downgrade() -> None:
    # Re-add foreign key constraints
    op.create_foreign_key('comments_user_id_fkey', 'comments', 'users', ['user_id'], ['id'], ondelete='CASCADE')
    op.create_foreign_key('comment_reactions_user_id_fkey', 'comment_reactions', 'users', ['user_id'], ['id'], ondelete='CASCADE')
