"""merge_heads

Revision ID: ab09f896f176
Revises: 68143e5f03a6, e67e7585462e
Create Date: 2026-07-06 16:44:31.815518

"""
from collections.abc import Sequence

# revision identifiers, used by Alembic.
revision: str = 'ab09f896f176'
down_revision: str | None = ('68143e5f03a6', 'e67e7585462e')
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
