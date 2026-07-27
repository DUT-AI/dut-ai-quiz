"""add HNSW index for related-question search

Revision ID: c81f2a9d4e73
Revises: b2c3d4e5f6a7, f78a22cf302a
Create Date: 2026-07-28
"""

from typing import Sequence

from alembic import op


revision: str = "c81f2a9d4e73"
down_revision: tuple[str, str] = ("b2c3d4e5f6a7", "f78a22cf302a")
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_index(
        "ix_questions_embedding_hnsw",
        "questions",
        ["embedding"],
        postgresql_using="hnsw",
        postgresql_ops={"embedding": "vector_cosine_ops"},
    )


def downgrade() -> None:
    op.drop_index("ix_questions_embedding_hnsw", table_name="questions")
