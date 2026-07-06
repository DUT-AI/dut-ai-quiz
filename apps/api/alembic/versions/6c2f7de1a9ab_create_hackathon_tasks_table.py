"""create hackathon_tasks table

Revision ID: 6c2f7de1a9ab
Revises: 8e800767ffdc
Create Date: 2026-07-04 09:00:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import ENUM as PGEnum


# revision identifiers, used by Alembic.
revision: str = "6c2f7de1a9ab"
down_revision: Union[str, None] = "cc1812904cd2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


metric_type_enum = PGEnum(
    "rmse",
    "f1_score",
    "accuracy",
    name="metric_type_enum",
    create_type=False,
)


def upgrade() -> None:
    metric_type_enum.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "hackathon_tasks",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("hackathon_id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("problem_description_md", sa.Text(), nullable=False),
        sa.Column("private_test_url", sa.Text(), nullable=False),
        sa.Column("public_test_url", sa.Text(), nullable=False),
        sa.Column("metric_type", metric_type_enum, nullable=False),
        sa.Column("max_submissions", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["hackathon_id"], ["hackathons.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_hackathon_tasks_hackathon_id"),
        "hackathon_tasks",
        ["hackathon_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_hackathon_tasks_hackathon_id"), table_name="hackathon_tasks")
    op.drop_table("hackathon_tasks")
    metric_type_enum.drop(op.get_bind(), checkfirst=True)
