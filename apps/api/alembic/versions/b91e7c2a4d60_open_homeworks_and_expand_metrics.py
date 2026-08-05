"""open homework access and expand hackathon metrics

Revision ID: b91e7c2a4d60
Revises: a81c4e7d2f90
Create Date: 2026-08-04
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql


revision: str = "b91e7c2a4d60"
down_revision: str | Sequence[str] | None = "a81c4e7d2f90"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

_OLD_METRICS = ("rmse", "f1_score", "accuracy")
_METRICS = (
    "accuracy",
    "balanced_accuracy",
    "precision",
    "recall",
    "f1_score",
    "f1_macro",
    "f1_weighted",
    "roc_auc",
    "log_loss",
    "mae",
    "mse",
    "rmse",
    "r2",
    "mape",
)


def _replace_metric_enum(values: tuple[str, ...]) -> None:
    bind = op.get_bind()
    op.execute(
        "ALTER TABLE hackathon_tasks "
        "ALTER COLUMN metric_type TYPE VARCHAR(40) "
        "USING metric_type::text"
    )
    op.execute("DROP TYPE metric_type_enum")
    postgresql.ENUM(*values, name="metric_type_enum").create(bind)
    op.execute(
        "ALTER TABLE hackathon_tasks "
        "ALTER COLUMN metric_type TYPE metric_type_enum "
        "USING metric_type::metric_type_enum"
    )


def upgrade() -> None:
    op.drop_table("homework_assignments")
    _replace_metric_enum(_METRICS)


def downgrade() -> None:
    unsupported = (
        op.get_bind()
        .execute(
            sa.text(
                "SELECT count(*) FROM hackathon_tasks "
                "WHERE metric_type::text NOT IN :metrics"
            ).bindparams(sa.bindparam("metrics", expanding=True)),
            {"metrics": _OLD_METRICS},
        )
        .scalar_one()
    )
    if unsupported:
        raise RuntimeError(
            "Cannot downgrade while hackathon tasks use newly added metrics."
        )
    _replace_metric_enum(_OLD_METRICS)
    op.create_table(
        "homework_assignments",
        sa.Column("homework_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("assigned_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(
            ["homework_id"],
            ["homeworks.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("homework_id", "user_id"),
    )
    op.create_index(
        "ix_homework_assignments_user_id",
        "homework_assignments",
        ["user_id"],
    )
