"""create lesson_videos table

Revision ID: a12b3c4d5e6f
Revises: f01a2b3c4d5e
Create Date: 2026-11-01 15:45:00.000000

"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "a12b3c4d5e6f"
down_revision = "f01a2b3c4d5e"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "lesson_videos",
        sa.Column(
            "id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False
        ),
        sa.Column(
            "lesson_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("lessons.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("url", sa.Text(), nullable=False),
        sa.Column("youtube_video_id", sa.String(length=32), nullable=False),
        sa.Column("start_seconds", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("description", sa.Text(), nullable=False, server_default=""),
        sa.Column(
            "created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()
        ),
        sa.Column(
            "updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()
        ),
    )
    op.create_index(
        op.f("ix_lesson_videos_lesson_id"), "lesson_videos", ["lesson_id"], unique=False
    )
    op.create_index(
        op.f("ix_lesson_videos_youtube_video_id"),
        "lesson_videos",
        ["youtube_video_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_lesson_videos_youtube_video_id"), table_name="lesson_videos")
    op.drop_index(op.f("ix_lesson_videos_lesson_id"), table_name="lesson_videos")
    op.drop_table("lesson_videos")
