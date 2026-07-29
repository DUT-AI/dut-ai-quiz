"""recognize the legacy development database revision

Revision ID: c36dc2df5ded
Revises: c81f2a9d4e73
Create Date: 2026-07-28

Some existing DUT Quiz databases were stamped with ``c36dc2df5ded`` by an
older development branch whose migration file is no longer present. Their
schema already contains the c81 application data, while a follow-up repair
revision reconciles the lesson embedding cache safely.
"""

from collections.abc import Sequence


revision: str = "c36dc2df5ded"
down_revision: str | Sequence[str] | None = "c81f2a9d4e73"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
