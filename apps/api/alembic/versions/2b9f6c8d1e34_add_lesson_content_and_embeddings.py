"""add lesson content and chunk embeddings

Revision ID: 2b9f6c8d1e34
Revises: 1a32520df240
Create Date: 2026-07-21
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "2b9f6c8d1e34"
down_revision: str | None = "1a32520df240"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "lessons",
        sa.Column("content_md", sa.Text(), nullable=False, server_default=sa.text("''")),
    )
    op.create_table(
        "lesson_chunks",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("lesson_id", sa.Uuid(), nullable=False),
        sa.Column("chunk_index", sa.Integer(), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("source_hash", sa.String(length=64), nullable=False),
        sa.Column("embedding", sa.ARRAY(sa.Float()), nullable=False),
        sa.Column("embedding_model", sa.String(length=200), nullable=False),
        sa.ForeignKeyConstraint(["lesson_id"], ["lessons.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_lesson_chunks_lesson_id", "lesson_chunks", ["lesson_id"])
    op.create_index("ix_lesson_chunks_source_hash", "lesson_chunks", ["source_hash"])
    op.create_index("ix_lesson_chunks_embedding_model", "lesson_chunks", ["embedding_model"])
    op.create_index(
        "uq_lesson_chunks_lesson_chunk_index",
        "lesson_chunks",
        ["lesson_id", "chunk_index"],
        unique=True,
    )


def downgrade() -> None:
    op.drop_table("lesson_chunks")
    op.drop_column("lessons", "content_md")
