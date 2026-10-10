import asyncio
import importlib.util
import os
import re
from datetime import timedelta
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import AsyncMock
from uuid import uuid4

import pytest
import pytest_asyncio
from alembic.migration import MigrationContext
from alembic.operations import Operations
from app.config import settings
from app.core.datetime_utils import now_ict
from app.infrastructure.persistence.models.homework import Homework, HomeworkSubmission
from app.infrastructure.repositories.homeworks import HomeworkRepository
from sqlalchemy import Column, MetaData, Table, inspect, select
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.engine import make_url
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.schema import CreateSchema, DropSchema
from worker_evaluate_homework.infrastructure import postgres_repository


@pytest_asyncio.fixture
async def repository(monkeypatch):
    url = make_url(os.environ.get("HOMEWORK_TEST_DATABASE_URL", settings.database_url))
    if url.host not in {"localhost", "127.0.0.1"}:
        pytest.skip("Repository integration tests run against local PostgreSQL only")
    schema = "codex_homework_test_" + uuid4().hex
    engine = create_async_engine(url, connect_args={"server_settings": {"search_path": schema}})
    async with engine.begin() as connection:
        await connection.execute(CreateSchema(schema))
        metadata = MetaData()
        Table("lessons", metadata, Column("id", UUID(as_uuid=True), primary_key=True))
        Homework.__table__.to_metadata(metadata)
        HomeworkSubmission.__table__.to_metadata(metadata)
        await connection.run_sync(metadata.create_all)
    sessions = async_sessionmaker(engine, expire_on_commit=False)
    monkeypatch.setattr(postgres_repository, "AsyncSessionLocal", sessions)
    async with sessions() as session:
        homework = Homework(title="test", description="", created_by=1, grading_status="READY")
        session.add(homework)
        await session.flush()
        submission = HomeworkSubmission(
            homework_id=homework.id, user_id=1, object_key="test.zip", original_filename="test.zip"
        )
        session.add(submission)
        await session.commit()
        homework_id, submission_id = homework.id, submission.id
    try:
        yield (
            postgres_repository.PostgresHomeworkGradingRepository(),
            sessions,
            engine,
            homework_id,
            submission_id,
        )
    finally:
        # Cleanup is restricted to this fixture's newly created random schema.
        assert re.fullmatch(r"codex_homework_test_[0-9a-f]{32}", schema)
        async with engine.begin() as connection:
            await connection.execute(DropSchema(schema, cascade=True))
        await engine.dispose()


@pytest.mark.asyncio
async def test_atomic_claim_allows_only_one_worker(repository):
    repo, sessions, _, _, submission_id = repository
    claimed = await asyncio.gather(*[repo.set_submission_grading(submission_id) for _ in range(3)])
    assert claimed.count(True) == 1
    async with sessions() as session:
        submission = await session.get(HomeworkSubmission, submission_id)
        assert submission.grading_attempts == 1
        assert submission.grading_started_at is not None


@pytest.mark.asyncio
async def test_permanent_error_is_excluded_from_cron(repository):
    repo, _, _, _, submission_id = repository
    assert await repo.set_submission_grading(submission_id)
    await repo.save_submission_error(
        submission_id, "LLM exceed_context_size_error", final=True, retryable=False
    )
    assert await repo.list_stale_submission_ids() == []
    assert not await repo.set_submission_grading(submission_id)


@pytest.mark.asyncio
async def test_attempt_limit_survives_new_cron_jobs(repository):
    repo, _, _, _, submission_id = repository
    for _attempt in range(settings.homework_grading_max_attempts):
        assert await repo.set_submission_grading(submission_id)
        await repo.save_submission_error(submission_id, "LLM 503", final=False, retryable=True)
    assert not await repo.set_submission_grading(submission_id)
    assert await repo.list_stale_submission_ids() == []


@pytest.mark.asyncio
async def test_recent_lease_is_not_stale_even_for_old_submission(repository):
    repo, sessions, _, _, submission_id = repository
    async with sessions() as session:
        submission = await session.get(HomeworkSubmission, submission_id)
        submission.submitted_at = now_ict() - timedelta(days=1)
        await session.commit()
    assert await repo.set_submission_grading(submission_id)
    assert await repo.list_stale_submission_ids() == []
    async with sessions() as session:
        submission = await session.get(HomeworkSubmission, submission_id)
        submission.grading_started_at = now_ict() - timedelta(
            seconds=settings.homework_grading_timeout_seconds + 120
        )
        await session.commit()
    assert await repo.list_stale_submission_ids() == [submission_id]
    assert await repo.set_submission_grading(submission_id)


@pytest.mark.asyncio
async def test_manual_retry_resets_internal_attempt_metadata(repository):
    repo, sessions, _, _, submission_id = repository
    assert await repo.set_submission_grading(submission_id)
    await repo.save_submission_error(submission_id, "LLM context", final=True, retryable=False)
    async with sessions() as session:
        await HomeworkRepository(session).retry_failed_submission(submission_id)
        await session.commit()
        submission = await session.get(HomeworkSubmission, submission_id)
        assert submission.grading_attempts == 0
        assert submission.grading_retryable is True
    assert await repo.set_submission_grading(submission_id)


@pytest.mark.asyncio
async def test_rubric_claims_and_retries_are_also_bounded(repository):
    repo, sessions, _, homework_id, _ = repository
    async with sessions() as session:
        homework = await session.get(Homework, homework_id)
        homework.grading_status = "PENDING"
        await session.commit()
    for _attempt in range(settings.homework_grading_max_attempts):
        assert await repo.set_homework_processing(homework_id)
        assert not await repo.set_homework_processing(homework_id)
        await repo.save_homework_error(homework_id, "LLM 503", retryable=True)
    assert not await repo.set_homework_processing(homework_id)
    assert await repo.list_stale_homework_ids() == []


@pytest.mark.asyncio
async def test_metadata_migration_roundtrip_preserves_status_and_score(repository):
    _, sessions, engine, _, submission_id = repository
    async with sessions() as session:
        submission = await session.get(HomeworkSubmission, submission_id)
        submission.status = "FAILED"
        submission.score = 2.5
        await session.commit()
    path = (
        Path(__file__).resolve().parents[3]
        / "api/alembic/versions/d76f5b913a02_bound_homework_grading_retries.py"
    )
    spec = importlib.util.spec_from_file_location("retry_migration", path)
    migration = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(migration)

    def run(connection):
        with Operations.context(MigrationContext.configure(connection)):
            migration.downgrade()
            assert "grading_attempts" not in {
                c["name"] for c in inspect(connection).get_columns("homework_submissions")
            }
            migration.upgrade()

    async with engine.begin() as connection:
        await connection.run_sync(run)
    async with sessions() as session:
        submission = await session.scalar(
            select(HomeworkSubmission).where(HomeworkSubmission.id == submission_id)
        )
        assert submission.status == "FAILED" and submission.score == 2.5
        assert submission.grading_attempts == 0
        assert submission.grading_retryable is False


@pytest.mark.asyncio
@pytest.mark.parametrize("apply", [False, True])
async def test_recovery_selects_context_only_and_preserves_status_score(
    repository, monkeypatch, apply
):
    _, sessions, _, homework_id, submission_id = repository
    async with sessions() as session:
        submission = await session.get(HomeworkSubmission, submission_id)
        submission.status = "FAILED"
        submission.score = 0
        submission.grading_error = "LLM exceed_context_size_error"
        submission.grading_attempts = 3
        submission.grading_retryable = False
        others = [
            HomeworkSubmission(
                homework_id=homework_id,
                user_id=user_id,
                object_key="other.zip",
                original_filename="other.zip",
                status=status,
                score=score,
                grading_error=error,
                grading_started_at=started,
            )
            for user_id, status, score, error, started in (
                (2, "GRADED", 8.5, "LLM exceed_context_size_error", None),
                (3, "FAILED", 0, "Invalid archive", None),
                (4, "GRADING", None, "LLM exceed_context_size_error", now_ict()),
            )
        ]
        session.add_all(others)
        await session.commit()
    path = Path(__file__).resolve().parents[1] / "scripts/retry_context_failures.py"
    spec = importlib.util.spec_from_file_location("context_recovery", path)
    recovery = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(recovery)
    redis = AsyncMock()
    monkeypatch.setattr(recovery, "AsyncSessionLocal", sessions)
    monkeypatch.setattr(recovery, "create_pool", AsyncMock(return_value=redis))
    await recovery.replay(SimpleNamespace(apply=apply, days=7, limit=5, submission_id=None))
    async with sessions() as session:
        submission = await session.get(HomeworkSubmission, submission_id)
        assert submission.status == "FAILED" and submission.score == 0
        assert submission.grading_attempts == (0 if apply else 3)
        assert submission.grading_retryable is apply
        for other in others:
            stored = await session.get(HomeworkSubmission, other.id)
            assert stored.status == other.status and stored.score == other.score
    if apply:
        redis.enqueue_job.assert_awaited_once_with(
            "evaluate_homework_job",
            submission_id=str(submission_id),
            _queue_name=settings.homework_queue_name,
            _job_id=f"homework-evaluate:{submission_id}",
            _defer_by=1,
        )
    else:
        redis.enqueue_job.assert_not_awaited()
