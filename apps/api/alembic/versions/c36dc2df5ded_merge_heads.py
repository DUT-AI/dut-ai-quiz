"""merge_heads

Revision ID: c36dc2df5ded
Revises: 0ee448cd8596, c81f2a9d4e73
Create Date: 2026-07-28 10:59:08.724054

"""

from collections.abc import Sequence

# revision identifiers, used by Alembic.
revision: str = "c36dc2df5ded"
down_revision: str | None = ("0ee448cd8596", "c81f2a9d4e73")
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
