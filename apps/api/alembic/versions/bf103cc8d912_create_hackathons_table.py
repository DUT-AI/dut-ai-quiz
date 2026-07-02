"""create hackathons table

Revision ID: bf103cc8d912
Revises: a67e7585462d
Create Date: 2026-06-30 16:35:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "bf103cc8d912"
down_revision: Union[str, None] = "a67e7585462d"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "hackathons",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("description", sa.String(), nullable=False, server_default=""),
        sa.Column("rules", sa.String(), nullable=False, server_default=""),
        sa.Column("start_time", sa.DateTime(), nullable=True),
        sa.Column("end_time", sa.DateTime(), nullable=True),
        sa.Column("participation_mode", sa.String(), nullable=False, server_default="both"),
        sa.Column("created_by", sa.Integer(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_hackathons_created_by"), "hackathons", ["created_by"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_hackathons_created_by"), table_name="hackathons")
    op.drop_table("hackathons")
