"""merge multiple heads

Revision ID: 0ee448cd8596
Revises: b2c3d4e5f6a7, f78a22cf302a
Create Date: 2026-07-27 09:43:28.509178

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0ee448cd8596'
down_revision: Union[str, None] = ('b2c3d4e5f6a7', 'f78a22cf302a')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
