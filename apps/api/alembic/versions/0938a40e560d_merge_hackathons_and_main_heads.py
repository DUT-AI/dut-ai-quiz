"""merge hackathons and main heads

Revision ID: 0938a40e560d
Revises: 9f3a6b80b6ef, bf103cc8d912
Create Date: 2026-07-03 00:36:33.102377

"""

from collections.abc import Sequence

# revision identifiers, used by Alembic.
revision: str = "0938a40e560d"
down_revision: str | None = ("9f3a6b80b6ef", "bf103cc8d912")
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
