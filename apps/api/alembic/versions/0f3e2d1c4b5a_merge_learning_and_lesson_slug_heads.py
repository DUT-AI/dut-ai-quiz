"""merge learning stage 1 and lesson slug heads

Revision ID: 0f3e2d1c4b5a
Revises: 9d5def7ecf64, b7a3e8c9d123
Create Date: 2026-06-29 18:00:00.000000

"""

from collections.abc import Sequence

# revision identifiers, used by Alembic.
revision: str = "0f3e2d1c4b5a"
down_revision: str | Sequence[str] | None = (
    "9d5def7ecf64",
    "b7a3e8c9d123",
)
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
