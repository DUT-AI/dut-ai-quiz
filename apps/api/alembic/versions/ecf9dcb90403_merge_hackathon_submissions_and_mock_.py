"""merge hackathon submissions and mock enum heads

Revision ID: ecf9dcb90403
Revises: 68143e5f03a6, e67e7585462e
Create Date: 2026-07-06 16:16:05.572443

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ecf9dcb90403'
down_revision: Union[str, None] = ('68143e5f03a6', 'e67e7585462e')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
