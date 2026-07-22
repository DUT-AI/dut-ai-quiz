"""use pgvector and cache question embeddings

Revision ID: 7d4a91c2f6b8
Revises: 2b9f6c8d1e34
Create Date: 2026-07-22
"""

from typing import Sequence, Union

from alembic import op
from pgvector.sqlalchemy import Vector
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "7d4a91c2f6b8"
down_revision: Union[str, None] = "2b9f6c8d1e34"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")

    op.add_column(
        "lesson_chunks",
        sa.Column("contextual_content", sa.Text(), nullable=False, server_default=""),
    )
    op.add_column(
        "lesson_chunks",
        sa.Column(
            "heading_path",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'[]'::jsonb"),
        ),
    )
    op.add_column(
        "lesson_chunks",
        sa.Column("token_count", sa.Integer(), nullable=False, server_default="0"),
    )
    op.add_column(
        "lesson_chunks",
        sa.Column(
            "metadata",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'{}'::jsonb"),
        ),
    )
    # Existing array embeddings were generated with the previous 1536-dimension
    # provider and cannot be reused with Vietnamese SBERT's 768 dimensions.
    # Chunks are derived data and will be rebuilt by the lesson indexing worker.
    op.execute("DELETE FROM lesson_chunks")
    op.execute(
        "ALTER TABLE lesson_chunks "
        "ALTER COLUMN embedding TYPE vector(768) USING embedding::vector"
    )
    op.create_index(
        "ix_lesson_chunks_embedding_hnsw",
        "lesson_chunks",
        ["embedding"],
        postgresql_using="hnsw",
        postgresql_ops={"embedding": "vector_cosine_ops"},
    )
    op.alter_column(
        "lesson_chunks",
        "source_hash",
        existing_type=sa.String(length=64),
        comment=(
            "SHA-256 of lesson name, description and Markdown content; used to "
            "reject stale embeddings while a newer version is being indexed"
        ),
    )

    op.add_column(
        "questions", sa.Column("embedding", Vector(768), nullable=True)
    )
    op.add_column(
        "questions", sa.Column("embedding_model", sa.String(200), nullable=True)
    )
    op.add_column(
        "questions", sa.Column("embedding_source_hash", sa.String(64), nullable=True)
    )


def downgrade() -> None:
    op.drop_column("questions", "embedding_source_hash")
    op.drop_column("questions", "embedding_model")
    op.drop_column("questions", "embedding")

    op.drop_index("ix_lesson_chunks_embedding_hnsw", table_name="lesson_chunks")
    op.execute(
        "ALTER TABLE lesson_chunks ALTER COLUMN embedding TYPE double precision[] "
        "USING (embedding::real[])::double precision[]"
    )
    op.alter_column(
        "lesson_chunks",
        "source_hash",
        existing_type=sa.String(length=64),
        comment=None,
    )
    op.drop_column("lesson_chunks", "metadata")
    op.drop_column("lesson_chunks", "token_count")
    op.drop_column("lesson_chunks", "heading_path")
    op.drop_column("lesson_chunks", "contextual_content")
