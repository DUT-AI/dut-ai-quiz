"""add internal homework grading

Revision ID: a81c4e7d2f90
Revises: f2c7a1d9e480
Create Date: 2026-07-29
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql


revision: str = "a81c4e7d2f90"
down_revision: str | Sequence[str] | None = "f2c7a1d9e480"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "homeworks",
        sa.Column("grading_rubric", postgresql.JSONB(), nullable=True),
    )
    op.add_column(
        "homeworks",
        sa.Column(
            "grading_status",
            sa.String(length=30),
            server_default="PENDING",
            nullable=False,
        ),
    )
    op.add_column(
        "homeworks",
        sa.Column("grading_error", sa.Text(), nullable=True),
    )
    op.create_index(
        "ix_homeworks_grading_status",
        "homeworks",
        ["grading_status"],
    )

    op.create_table(
        "homework_submission_fingerprints",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            nullable=False,
        ),
        sa.Column(
            "submission_id",
            postgresql.UUID(as_uuid=True),
            nullable=False,
        ),
        sa.Column(
            "homework_id",
            postgresql.UUID(as_uuid=True),
            nullable=False,
        ),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("file_name", sa.String(length=255), nullable=False),
        sa.Column("code_hash", sa.String(length=64), nullable=False),
        sa.Column("fingerprints", postgresql.JSONB(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(
            ["homework_id"],
            ["homeworks.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["submission_id"],
            ["homework_submissions.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "submission_id",
            "file_name",
            name="uq_homework_submission_fingerprint_file",
        ),
    )
    op.create_index(
        "ix_homework_submission_fingerprints_submission_id",
        "homework_submission_fingerprints",
        ["submission_id"],
    )
    op.create_index(
        "ix_homework_submission_fingerprints_homework_id",
        "homework_submission_fingerprints",
        ["homework_id"],
    )
    op.create_index(
        "ix_homework_submission_fingerprints_user_id",
        "homework_submission_fingerprints",
        ["user_id"],
    )
    op.create_index(
        "ix_homework_fingerprints_lookup",
        "homework_submission_fingerprints",
        ["homework_id", "file_name", "user_id"],
    )


def downgrade() -> None:
    op.drop_table("homework_submission_fingerprints")
    op.drop_index("ix_homeworks_grading_status", table_name="homeworks")
    op.drop_column("homeworks", "grading_error")
    op.drop_column("homeworks", "grading_status")
    op.drop_column("homeworks", "grading_rubric")
