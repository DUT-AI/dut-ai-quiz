"""repair the legacy lesson embedding schema

Revision ID: e5b2a7c9d104
Revises: c36dc2df5ded
Create Date: 2026-07-28
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from pgvector.sqlalchemy import Vector
from sqlalchemy.dialects import postgresql


revision: str = "e5b2a7c9d104"
down_revision: str | Sequence[str] | None = "c36dc2df5ded"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def _column_names(table_name: str) -> set[str]:
    return {
        column["name"]
        for column in sa.inspect(op.get_bind()).get_columns(table_name)
    }


def _index_names(table_name: str) -> set[str]:
    return {
        index["name"]
        for index in sa.inspect(op.get_bind()).get_indexes(table_name)
    }


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = set(inspector.get_table_names())
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")

    if "lesson_chunks" in tables:
        columns = _column_names("lesson_chunks")
        embedding_type = bind.execute(
            sa.text(
                """
                SELECT data_type
                FROM information_schema.columns
                WHERE table_schema = current_schema()
                  AND table_name = 'lesson_chunks'
                  AND column_name = 'embedding'
                """
            )
        ).scalar_one_or_none()

        if embedding_type == "ARRAY":
            # The legacy 1536-dimensional chunks are derived data. Preserve a
            # copy before clearing them so the vector(768) conversion is safe.
            op.execute(
                """
                CREATE TABLE IF NOT EXISTS lesson_chunks_legacy_1536_backup
                AS TABLE lesson_chunks WITH NO DATA
                """
            )
            backup_count = bind.execute(
                sa.text(
                    "SELECT count(*) FROM lesson_chunks_legacy_1536_backup"
                )
            ).scalar_one()
            if backup_count == 0:
                op.execute(
                    """
                    INSERT INTO lesson_chunks_legacy_1536_backup
                    SELECT * FROM lesson_chunks
                    """
                )
            op.execute("DELETE FROM lesson_chunks")
            op.execute(
                """
                ALTER TABLE lesson_chunks
                ALTER COLUMN embedding TYPE vector(768)
                USING embedding::vector
                """
            )

        if "contextual_content" not in columns:
            op.add_column(
                "lesson_chunks",
                sa.Column(
                    "contextual_content",
                    sa.Text(),
                    nullable=False,
                    server_default="",
                ),
            )
        if "heading_path" not in columns:
            op.add_column(
                "lesson_chunks",
                sa.Column(
                    "heading_path",
                    postgresql.JSONB(astext_type=sa.Text()),
                    nullable=False,
                    server_default=sa.text("'[]'::jsonb"),
                ),
            )
        if "token_count" not in columns:
            op.add_column(
                "lesson_chunks",
                sa.Column(
                    "token_count",
                    sa.Integer(),
                    nullable=False,
                    server_default="0",
                ),
            )
        if "metadata" not in columns:
            op.add_column(
                "lesson_chunks",
                sa.Column(
                    "metadata",
                    postgresql.JSONB(astext_type=sa.Text()),
                    nullable=False,
                    server_default=sa.text("'{}'::jsonb"),
                ),
            )

        if "ix_lesson_chunks_embedding_hnsw" not in _index_names(
            "lesson_chunks"
        ):
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
                "SHA-256 of lesson name, description and Markdown content; "
                "used to reject stale embeddings while a newer version is "
                "being indexed"
            ),
        )

    if "questions" in tables:
        columns = _column_names("questions")
        if "embedding" not in columns:
            op.add_column(
                "questions",
                sa.Column("embedding", Vector(768), nullable=True),
            )
        if "embedding_model" not in columns:
            op.add_column(
                "questions",
                sa.Column(
                    "embedding_model", sa.String(length=200), nullable=True
                ),
            )
        if "embedding_source_hash" not in columns:
            op.add_column(
                "questions",
                sa.Column(
                    "embedding_source_hash",
                    sa.String(length=64),
                    nullable=True,
                ),
            )
        if "ix_questions_embedding_hnsw" not in _index_names("questions"):
            op.create_index(
                "ix_questions_embedding_hnsw",
                "questions",
                ["embedding"],
                postgresql_using="hnsw",
                postgresql_ops={"embedding": "vector_cosine_ops"},
            )


def downgrade() -> None:
    # Compatibility repairs are intentionally not reversed: converting the
    # active cache back to the legacy 1536-dimensional format would discard
    # newly indexed 768-dimensional data. The legacy rows remain in the backup
    # table for manual recovery if ever needed.
    pass
