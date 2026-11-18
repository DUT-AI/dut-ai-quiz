"""merge_heads

Revision ID: ccd2a6fc74bb
Revises: a91e7b3c2d60, b23c4d5e6f7a
Create Date: 2026-11-18 15:10:37.199078

"""

from collections.abc import Sequence

# revision identifiers, used by Alembic.
revision: str = "ccd2a6fc74bb"
down_revision: str | None = ("a91e7b3c2d60", "b23c4d5e6f7a")
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
