"""cascade_delete_questions_and_homeworks_on_lesson_delete

Revision ID: f2280fa41e46
Revises: a04acd51f320
Create Date: 2026-09-26 20:53:22.811282

"""
from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = 'f2280fa41e46'
down_revision: Union[str, None] = 'a04acd51f320'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Homeworks CASCADE on lesson deletion
    op.drop_constraint('fk_homeworks_lesson_id', 'homeworks', type_='foreignkey')
    op.create_foreign_key(
        'fk_homeworks_lesson_id',
        'homeworks',
        'lessons',
        ['lesson_id'],
        ['id'],
        ondelete='CASCADE',
    )

    # 2. Questions CASCADE on lesson deletion
    op.drop_constraint('questions_lesson_id_fkey', 'questions', type_='foreignkey')
    op.create_foreign_key(
        'questions_lesson_id_fkey',
        'questions',
        'lessons',
        ['lesson_id'],
        ['id'],
        ondelete='CASCADE',
    )


def downgrade() -> None:
    # 1. Revert Questions FK to NO ACTION
    op.drop_constraint('questions_lesson_id_fkey', 'questions', type_='foreignkey')
    op.create_foreign_key(
        'questions_lesson_id_fkey',
        'questions',
        'lessons',
        ['lesson_id'],
        ['id'],
    )

    # 2. Revert Homeworks FK to RESTRICT
    op.drop_constraint('fk_homeworks_lesson_id', 'homeworks', type_='foreignkey')
    op.create_foreign_key(
        'fk_homeworks_lesson_id',
        'homeworks',
        'lessons',
        ['lesson_id'],
        ['id'],
        ondelete='RESTRICT',
    )

