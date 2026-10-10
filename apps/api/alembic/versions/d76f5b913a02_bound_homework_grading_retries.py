"""Persist grading attempts and leases without changing public statuses or scores.

Revision ID: d76f5b913a02
Revises: c98e1a2b3c4d
"""

import sqlalchemy as sa
from alembic import op

revision = "d76f5b913a02"
down_revision = "c98e1a2b3c4d"
branch_labels = None
depends_on = None


def upgrade() -> None:
    for table in ("homeworks", "homework_submissions"):
        op.add_column(
            table, sa.Column("grading_attempts", sa.Integer(), nullable=False, server_default="0")
        )
        op.add_column(table, sa.Column("grading_started_at", sa.DateTime(), nullable=True))
        op.add_column(
            table,
            sa.Column("grading_retryable", sa.Boolean(), nullable=False, server_default=sa.true()),
        )
    # Historical failures have no typed retry policy. Only explicit replay may reset them.
    op.execute("UPDATE homeworks SET grading_retryable = false WHERE grading_status = 'FAILED'")
    op.execute("UPDATE homework_submissions SET grading_retryable = false WHERE status = 'FAILED'")


def downgrade() -> None:
    for table in ("homework_submissions", "homeworks"):
        for column in ("grading_retryable", "grading_started_at", "grading_attempts"):
            op.drop_column(table, column)
