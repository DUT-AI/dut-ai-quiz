"""add mock to pooltype enum

Revision ID: e67e7585462e
Revises: 0938a40e560d
Create Date: 2026-07-06 12:15:00.000000

"""
from collections.abc import Sequence

from alembic import op

# revision identifiers, used by Alembic.
revision: str = 'e67e7585462e'
down_revision: str | None = '0938a40e560d'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # ALTER TYPE ... ADD VALUE cannot run inside a transaction in older Postgres versions,
    # but we can commit the current transaction and execute it safely.
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        op.execute("COMMIT")
        op.execute("ALTER TYPE pooltype ADD VALUE 'MOCK'")


def downgrade() -> None:
    # Reverting/removing an enum value in PostgreSQL is not directly supported via ALTER TYPE.
    # Typically, this is left as a no-op (pass) in migrations.
    pass
