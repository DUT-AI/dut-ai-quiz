"""bridge missing deployed revision cc1812904cd2

Revision ID: cc1812904cd2
Revises: 8e800767ffdc
Create Date: 2026-07-05 00:00:00.000000

This placeholder restores the missing revision referenced by the current database
state. It intentionally performs no schema change.
"""

from collections.abc import Sequence

# revision identifiers, used by Alembic.
revision: str = "cc1812904cd2"
down_revision: str | None = "8e800767ffdc"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
