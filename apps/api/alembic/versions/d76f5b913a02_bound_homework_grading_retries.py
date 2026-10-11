"""Persist grading attempts and leases without changing public statuses or scores.

Revision ID: d76f5b913a02
Revises: c98e1a2b3c4d
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "d76f5b913a02"
down_revision: str | Sequence[str] | None = "c98e1a2b3c4d"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "homeworks",
        sa.Column("grading_attempts", sa.Integer(), nullable=False, server_default="0"),
    )
    op.add_column("homeworks", sa.Column("grading_started_at", sa.DateTime(), nullable=True))
    op.add_column(
        "homeworks",
        sa.Column("grading_retryable", sa.Boolean(), nullable=False, server_default=sa.true()),
    )
    op.add_column(
        "homework_submissions",
        sa.Column("grading_attempts", sa.Integer(), nullable=False, server_default="0"),
    )
    op.add_column(
        "homework_submissions", sa.Column("grading_started_at", sa.DateTime(), nullable=True)
    )
    op.add_column(
        "homework_submissions",
        sa.Column("grading_retryable", sa.Boolean(), nullable=False, server_default=sa.true()),
    )

    # Old failures have no reliable error classification. Keep automatic retry disabled
    # until an explicit replay resets the metadata; statuses and scores stay intact.
    homeworks = sa.table(
        "homeworks",
        sa.column("grading_status", sa.String()),
        sa.column("grading_retryable", sa.Boolean()),
    )
    submissions = sa.table(
        "homework_submissions",
        sa.column("status", sa.String()),
        sa.column("grading_retryable", sa.Boolean()),
    )
    op.execute(
        homeworks.update()
        .where(homeworks.c.grading_status == op.inline_literal("FAILED"))
        .values(grading_retryable=sa.false())
    )
    op.execute(
        submissions.update()
        .where(submissions.c.status == op.inline_literal("FAILED"))
        .values(grading_retryable=sa.false())
    )


def downgrade() -> None:
    op.drop_column("homework_submissions", "grading_retryable")
    op.drop_column("homework_submissions", "grading_started_at")
    op.drop_column("homework_submissions", "grading_attempts")
    op.drop_column("homeworks", "grading_retryable")
    op.drop_column("homeworks", "grading_started_at")
    op.drop_column("homeworks", "grading_attempts")
