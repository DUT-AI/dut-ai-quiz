"""add user_source to users

Revision ID: c98e1a2b3c4d
Revises: 7a8e9f1c2d34
Create Date: 2026-10-06 16:11:00.000000

"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "c98e1a2b3c4d"
down_revision: str | None = "7a8e9f1c2d34"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column(
            "user_source",
            sa.String(length=30),
            nullable=False,
            server_default="INTERNAL",
        ),
    )
    op.create_index(
        op.f("ix_users_user_source"),
        "users",
        ["user_source"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_users_user_source"), table_name="users")
    op.drop_column("users", "user_source")
