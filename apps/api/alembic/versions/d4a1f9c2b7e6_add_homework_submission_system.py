"""add homework submission system

Revision ID: d4a1f9c2b7e6
Revises: e5b2a7c9d104
Create Date: 2026-07-28
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "d4a1f9c2b7e6"
down_revision: str | Sequence[str] | None = "e5b2a7c9d104"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "homeworks",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), server_default="", nullable=False),
        sa.Column("deadline", sa.DateTime(), nullable=False),
        sa.Column("attachment_key", sa.Text(), nullable=True),
        sa.Column("created_by", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.Column("archived_at", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_homeworks_title", "homeworks", ["title"])
    op.create_index("ix_homeworks_deadline", "homeworks", ["deadline"])
    op.create_index("ix_homeworks_created_by", "homeworks", ["created_by"])
    op.create_index("ix_homeworks_archived_at", "homeworks", ["archived_at"])

    op.create_table(
        "homework_assignments",
        sa.Column("homework_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("assigned_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(
            ["homework_id"], ["homeworks.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("homework_id", "user_id"),
    )
    op.create_index(
        "ix_homework_assignments_user_id",
        "homework_assignments",
        ["user_id"],
    )

    op.create_table(
        "homework_submissions",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("homework_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("object_key", sa.Text(), nullable=False),
        sa.Column("original_filename", sa.String(length=255), nullable=False),
        sa.Column("submitted_at", sa.DateTime(), nullable=False),
        sa.Column("is_late", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("attempt_number", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(length=30), server_default="UPLOADED", nullable=False),
        sa.Column("is_pass", sa.Boolean(), nullable=True),
        sa.Column("score", sa.Float(), nullable=True),
        sa.Column("feedback", sa.Text(), nullable=True),
        sa.Column("score_details", postgresql.JSONB(), nullable=True),
        sa.Column("plagiarism_info", postgresql.JSONB(), nullable=True),
        sa.Column(
            "is_plagiarized", sa.Boolean(), server_default="false", nullable=False
        ),
        sa.Column("plagiarized_from_user_id", sa.Integer(), nullable=True),
        sa.Column("grading_error", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(
            ["homework_id"], ["homeworks.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "homework_id",
            "user_id",
            "attempt_number",
            name="uq_homework_submission_attempt",
        ),
    )
    op.create_index(
        "ix_homework_submissions_homework_id",
        "homework_submissions",
        ["homework_id"],
    )
    op.create_index(
        "ix_homework_submissions_user_id",
        "homework_submissions",
        ["user_id"],
    )
    op.create_index(
        "ix_homework_submissions_submitted_at",
        "homework_submissions",
        ["submitted_at"],
    )
    op.create_index(
        "ix_homework_submissions_status",
        "homework_submissions",
        ["status"],
    )
    op.create_index(
        "ix_homework_submissions_latest",
        "homework_submissions",
        ["homework_id", "user_id", "attempt_number"],
    )


def downgrade() -> None:
    op.drop_table("homework_submissions")
    op.drop_table("homework_assignments")
    op.drop_table("homeworks")
