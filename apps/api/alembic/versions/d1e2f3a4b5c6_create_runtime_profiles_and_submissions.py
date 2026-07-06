"""create_runtime_profiles_and_submissions

Revision ID: d1e2f3a4b5c6
Revises: 290d08356122
Create Date: 2026-07-06 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'd1e2f3a4b5c6'
down_revision: Union[str, None] = '290d08356122'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create dependency_request_status_enum (check if exists first)
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE dependency_request_status_enum AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)

    # Create submission_status_enum (check if exists first)
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE submission_status_enum AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'TIMEOUT');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)

    # Create runtime_profiles table
    op.create_table(
        'runtime_profiles',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(100), nullable=False, unique=True),
        sa.Column('display_name', sa.String(200), nullable=False),
        sa.Column('description', sa.Text(), nullable=False, server_default=''),
        sa.Column('docker_image', sa.String(500), nullable=False),
        sa.Column('docker_image_tag', sa.String(100), nullable=False),
        sa.Column('python_version', sa.String(50), nullable=True),
        sa.Column('cuda_version', sa.String(50), nullable=True),
        sa.Column('allowed_packages_json', sa.Text(), nullable=True),
        sa.Column('cpu_limit', sa.Float(), nullable=False, server_default='2.0'),
        sa.Column('memory_limit_mb', sa.Integer(), nullable=False, server_default='2048'),
        sa.Column('gpu_enabled', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('gpu_limit', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('timeout_seconds', sa.Integer(), nullable=False, server_default='300'),
        sa.Column('pids_limit', sa.Integer(), nullable=False, server_default='100'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
    )
    op.create_index('ix_runtime_profiles_name', 'runtime_profiles', ['name'])
    op.create_index('ix_runtime_profiles_is_active', 'runtime_profiles', ['is_active'])

    # Create dependency_requests table
    op.create_table(
        'dependency_requests',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('hackathon_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('task_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('team_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('package_name', sa.String(200), nullable=False),
        sa.Column('package_version', sa.String(50), nullable=True),
        sa.Column('reason', sa.Text(), nullable=False),
        sa.Column('status', postgresql.ENUM('PENDING', 'APPROVED', 'REJECTED', name='dependency_request_status_enum', create_type=False), nullable=False, server_default='PENDING'),
        sa.Column('admin_note', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('reviewed_at', sa.DateTime(), nullable=True),
        sa.Column('reviewed_by', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['hackathon_id'], ['hackathons.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['task_id'], ['hackathon_tasks.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['team_id'], ['hackathon_teams.id'], ondelete='CASCADE'),
    )
    op.create_index('ix_dependency_requests_hackathon_id', 'dependency_requests', ['hackathon_id'])
    op.create_index('ix_dependency_requests_task_id', 'dependency_requests', ['task_id'])
    op.create_index('ix_dependency_requests_user_id', 'dependency_requests', ['user_id'])
    op.create_index('ix_dependency_requests_team_id', 'dependency_requests', ['team_id'])
    op.create_index('ix_dependency_requests_status', 'dependency_requests', ['status'])
    op.create_index('ix_dependency_requests_created_at', 'dependency_requests', ['created_at'])

    # Create hackathon_submissions table
    op.create_table(
        'hackathon_submissions',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('task_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('team_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('runtime_profile_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('script_s3_key', sa.String(500), nullable=False),
        sa.Column('model_s3_key', sa.String(500), nullable=True),
        sa.Column('status', postgresql.ENUM('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'TIMEOUT', name='submission_status_enum', create_type=False), nullable=False, server_default='PENDING'),
        sa.Column('score', sa.Float(), nullable=True),
        sa.Column('execution_log', sa.Text(), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('submitted_at', sa.DateTime(), nullable=False),
        sa.Column('started_at', sa.DateTime(), nullable=True),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['task_id'], ['hackathon_tasks.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['team_id'], ['hackathon_teams.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['runtime_profile_id'], ['runtime_profiles.id'], ondelete='RESTRICT'),
    )
    op.create_index('ix_hackathon_submissions_task_id', 'hackathon_submissions', ['task_id'])
    op.create_index('ix_hackathon_submissions_user_id', 'hackathon_submissions', ['user_id'])
    op.create_index('ix_hackathon_submissions_team_id', 'hackathon_submissions', ['team_id'])
    op.create_index('ix_hackathon_submissions_runtime_profile_id', 'hackathon_submissions', ['runtime_profile_id'])
    op.create_index('ix_hackathon_submissions_status', 'hackathon_submissions', ['status'])
    op.create_index('ix_hackathon_submissions_submitted_at', 'hackathon_submissions', ['submitted_at'])


def downgrade() -> None:
    # Drop tables
    op.drop_table('hackathon_submissions')
    op.drop_table('dependency_requests')
    op.drop_table('runtime_profiles')

    # Drop enums
    sa.Enum(name='submission_status_enum').drop(op.get_bind(), checkfirst=True)
    sa.Enum(name='dependency_request_status_enum').drop(op.get_bind(), checkfirst=True)
