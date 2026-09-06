"""merge multiple heads

Revision ID: 0ee448cd8596
Revises: b2c3d4e5f6a7, f78a22cf302a
Create Date: 2026-07-27 09:43:28.509178

"""
from collections.abc import Sequence

# revision identifiers, used by Alembic.
revision: str = '0ee448cd8596'
down_revision: str | None = ('b2c3d4e5f6a7', 'f78a22cf302a')
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
