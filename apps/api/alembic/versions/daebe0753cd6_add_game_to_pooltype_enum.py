"""add_game_to_pooltype_enum

Revision ID: daebe0753cd6
Revises: e144ea5f00bf
Create Date: 2026-07-06 16:58:24.656936

"""

from collections.abc import Sequence

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "daebe0753cd6"
down_revision: str | None = "e144ea5f00bf"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # ALTER TYPE ... ADD VALUE cannot run inside a transaction in Postgres,
    # so we commit first.
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        op.execute("COMMIT")
        op.execute("ALTER TYPE pooltype ADD VALUE 'GAME'")
    # Update any existing records
    op.execute("UPDATE questions SET pool_type = 'GAME' WHERE pool_type = 'MOCK'")


def downgrade() -> None:
    # Downgrade: typically ALTER TYPE ... DROP VALUE is not supported directly in PG.
    # We update back to 'MOCK' if any exist.
    op.execute("UPDATE questions SET pool_type = 'MOCK' WHERE pool_type = 'GAME'")
