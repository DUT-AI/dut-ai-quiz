"""update vector dimensions to 1024 for BAAI/bge-m3

Revision ID: a04acd51f320
Revises: e71b2a9c4d88
Create Date: 2026-09-24 18:15:00.000000

"""

from collections.abc import Sequence

from alembic import op

revision: str = "a04acd51f320"
down_revision: str | None = "e71b2a9c4d88"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # 1. Drop existing HNSW indexes on 768-dim vector columns
    op.execute("DROP INDEX IF EXISTS ix_lesson_chunks_embedding_hnsw")
    op.execute("DROP INDEX IF EXISTS ix_questions_embedding_hnsw")

    # 2. Reset existing 768-dim embeddings
    op.execute("DELETE FROM lesson_chunks")
    op.execute(
        "UPDATE questions SET embedding = NULL, embedding_model = NULL, embedding_source_hash = NULL"
    )

    # 3. Alter columns to vector(1024)
    op.execute("ALTER TABLE lesson_chunks ALTER COLUMN embedding TYPE vector(1024) USING NULL")
    op.execute("ALTER TABLE questions ALTER COLUMN embedding TYPE vector(1024) USING NULL")

    # 4. Recreate HNSW indexes with vector_cosine_ops for 1024-dim vectors
    op.create_index(
        "ix_lesson_chunks_embedding_hnsw",
        "lesson_chunks",
        ["embedding"],
        postgresql_using="hnsw",
        postgresql_ops={"embedding": "vector_cosine_ops"},
    )
    op.create_index(
        "ix_questions_embedding_hnsw",
        "questions",
        ["embedding"],
        postgresql_using="hnsw",
        postgresql_ops={"embedding": "vector_cosine_ops"},
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_lesson_chunks_embedding_hnsw")
    op.execute("DROP INDEX IF EXISTS ix_questions_embedding_hnsw")

    op.execute("DELETE FROM lesson_chunks")
    op.execute(
        "UPDATE questions SET embedding = NULL, embedding_model = NULL, embedding_source_hash = NULL"
    )

    op.execute("ALTER TABLE lesson_chunks ALTER COLUMN embedding TYPE vector(768) USING NULL")
    op.execute("ALTER TABLE questions ALTER COLUMN embedding TYPE vector(768) USING NULL")

    op.create_index(
        "ix_lesson_chunks_embedding_hnsw",
        "lesson_chunks",
        ["embedding"],
        postgresql_using="hnsw",
        postgresql_ops={"embedding": "vector_cosine_ops"},
    )
    op.create_index(
        "ix_questions_embedding_hnsw",
        "questions",
        ["embedding"],
        postgresql_using="hnsw",
        postgresql_ops={"embedding": "vector_cosine_ops"},
    )
