"""remove user foreign keys from comments

Revision ID: f78a22cf302a
Revises: 7d4a91c2f6b8
Create Date: 2026-07-26

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'f78a22cf302a'
down_revision: Union[str, None] = '7d4a91c2f6b8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Drop foreign key constraint from comments pointing to users
    op.drop_constraint('comments_user_id_fkey', 'comments', type_='foreignkey')
    # Drop foreign key constraint from comment_reactions pointing to users
    op.drop_constraint('comment_reactions_user_id_fkey', 'comment_reactions', type_='foreignkey')


def downgrade() -> None:
    # Re-add foreign key constraints
    op.create_foreign_key('comments_user_id_fkey', 'comments', 'users', ['user_id'], ['id'], ondelete='CASCADE')
    op.create_foreign_key('comment_reactions_user_id_fkey', 'comment_reactions', 'users', ['user_id'], ['id'], ondelete='CASCADE')
