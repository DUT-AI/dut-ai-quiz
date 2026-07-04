"""bridge missing deployed revision cc1812904cd2

Revision ID: cc1812904cd2
Revises: 8e800767ffdc
Create Date: 2026-07-05 00:00:00.000000

This placeholder restores the missing revision referenced by the current database
state. It intentionally performs no schema change.
"""

from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = "cc1812904cd2"
down_revision: Union[str, None] = "8e800767ffdc"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
