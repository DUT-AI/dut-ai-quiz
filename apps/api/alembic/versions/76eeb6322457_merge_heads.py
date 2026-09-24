"""merge heads

Revision ID: 76eeb6322457
Revises: 90d96481779d, a66a1656a354
Create Date: 2026-07-13 15:46:22.102980

"""

from collections.abc import Sequence

# revision identifiers, used by Alembic.
revision: str = "76eeb6322457"
down_revision: str | None = ("90d96481779d", "a66a1656a354")
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
