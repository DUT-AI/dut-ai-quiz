"""Add rotating refresh sessions independent of local user rows.

Revision ID: a91e7b3c2d60
Revises: 2f02e502a453
"""

import sqlalchemy as sa
from alembic import op

revision = "a91e7b3c2d60"
down_revision = "2f02e502a453"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "auth_sessions",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("user_source", sa.String(30), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_auth_sessions_user_id", "auth_sessions", ["user_id"])
    op.create_index("ix_auth_sessions_expires_at", "auth_sessions", ["expires_at"])
    op.create_table(
        "auth_refresh_tokens",
        sa.Column("token_hash", sa.String(64), nullable=False),
        sa.Column("session_id", sa.Uuid(), nullable=False),
        sa.Column("used_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(
            ["session_id"], ["auth_sessions.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("token_hash"),
    )
    op.create_index(
        "ix_auth_refresh_tokens_session_id", "auth_refresh_tokens", ["session_id"]
    )


def downgrade() -> None:
    op.drop_table("auth_refresh_tokens")
    op.drop_table("auth_sessions")
