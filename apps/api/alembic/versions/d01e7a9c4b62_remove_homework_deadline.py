"""remove homework deadline

Revision ID: d01e7a9c4b62
Revises: b91e7c2a4d60
Create Date: 2026-08-11
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "d01e7a9c4b62"
down_revision: str | Sequence[str] | None = "b91e7c2a4d60"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.drop_index("ix_homeworks_deadline", table_name="homeworks")
    op.drop_column("homeworks", "deadline")


def downgrade() -> None:
    op.add_column(
        "homeworks",
        sa.Column(
            "deadline",
            sa.DateTime(),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
    )
    op.alter_column("homeworks", "deadline", server_default=None)
    op.create_index("ix_homeworks_deadline", "homeworks", ["deadline"])
