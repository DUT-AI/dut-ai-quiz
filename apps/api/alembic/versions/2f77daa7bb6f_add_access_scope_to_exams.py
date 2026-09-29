"""add_access_scope_to_exams

Revision ID: 2f77daa7bb6f
Revises: f2280fa41e46
Create Date: 2026-09-29 10:20:04.117687

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2f77daa7bb6f'
down_revision: Union[str, None] = 'f2280fa41e46'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


from sqlalchemy.dialects import postgresql


def upgrade() -> None:
    # Create enum type if not exists
    access_scope_enum = postgresql.ENUM("PUBLIC", "RESTRICTED", name="examaccessscope")
    access_scope_enum.create(op.get_bind(), checkfirst=True)

    # Add access_scope column with default PUBLIC
    op.add_column(
        "exams",
        sa.Column(
            "access_scope",
            sa.Enum("PUBLIC", "RESTRICTED", name="examaccessscope", native_enum=True),
            nullable=False,
            server_default="PUBLIC",
        ),
    )

    # Backfill: If participant_ids is present and not empty, set access_scope to RESTRICTED
    op.execute(
        "UPDATE exams SET access_scope = 'RESTRICTED' WHERE cardinality(participant_ids) > 0"
    )

    # Create index on access_scope for fast querying
    op.create_index("ix_exams_access_scope", "exams", ["access_scope"])


def downgrade() -> None:
    op.drop_index("ix_exams_access_scope", table_name="exams")
    op.drop_column("exams", "access_scope")
    postgresql.ENUM(name="examaccessscope").drop(op.get_bind(), checkfirst=True)

