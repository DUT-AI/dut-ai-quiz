"""remove_mock_from_pooltype_enum

Revision ID: d6bc9878adb2
Revises: daebe0753cd6
Create Date: 2026-07-06 16:59:52.875231

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd6bc9878adb2'
down_revision: Union[str, None] = 'daebe0753cd6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Rename old enum type
    op.execute("ALTER TYPE pooltype RENAME TO pooltype_old")
    # Create new enum type with 'PRACTICE', 'EXAM', 'GAME'
    op.execute("CREATE TYPE pooltype AS ENUM ('PRACTICE', 'EXAM', 'GAME')")
    # Update table column to use new type
    op.execute("ALTER TABLE questions ALTER COLUMN pool_type TYPE pooltype USING pool_type::text::pooltype")
    # Drop old enum type
    op.execute("DROP TYPE pooltype_old")


def downgrade() -> None:
    # Rename enum type
    op.execute("ALTER TYPE pooltype RENAME TO pooltype_old")
    # Re-create old type with 'MOCK'
    op.execute("CREATE TYPE pooltype AS ENUM ('PRACTICE', 'EXAM', 'MOCK', 'GAME')")
    # Update table column
    op.execute("ALTER TABLE questions ALTER COLUMN pool_type TYPE pooltype USING pool_type::text::pooltype")
    # Drop old type
    op.execute("DROP TYPE pooltype_old")
